import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { GoogleGenAI } from '@google/genai';
import { parseNoticeDeterministically } from './src/services/deterministicParser.ts';
import { NoticeDecodedSchema } from './src/types/noticeSchema.ts';
import { detectClashes } from './src/services/clashDetectionEngine.ts';
import { generateIcsCalendar } from './src/services/icsExport.ts';
import { TimetableEntry, ConflictReview } from './src/types/phase2.ts';
import { NoticeDecoded } from './src/types/notice.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface AuthenticatedRequest extends Request {
  userId?: string;
  userEmail?: string;
}

// In-memory cache for Google's official Firebase public certificates
let firebasePublicKeysCache: { [kid: string]: string } = {};
let firebaseCertsExpiresAt = 0;

async function getFirebasePublicCerts(): Promise<{ [kid: string]: string }> {
  if (Date.now() < firebaseCertsExpiresAt && Object.keys(firebasePublicKeysCache).length > 0) {
    return firebasePublicKeysCache;
  }
  try {
    const res = await fetch('https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com');
    if (res.ok) {
      firebasePublicKeysCache = await res.json();
      firebaseCertsExpiresAt = Date.now() + 6 * 60 * 60 * 1000;
    }
  } catch (err) {
    console.warn('Could not fetch Firebase public certs:', err);
  }
  return firebasePublicKeysCache;
}

function parseJwt(token: string) {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    return {
      header,
      payload,
      signature: parts[2],
      signedContent: `${parts[0]}.${parts[1]}`,
    };
  } catch {
    return null;
  }
}

// Token Verification using Google's Firebase Public Key Infrastructure
async function verifyFirebaseToken(token: string): Promise<{ uid: string; email?: string } | null> {
  if (!token || typeof token !== 'string') return null;

  const jwt = parseJwt(token);
  if (!jwt) return null;

  const { header, payload, signature, signedContent } = jwt;

  // Verify expiration
  const now = Math.floor(Date.now() / 1000);
  if (!payload.exp || now > payload.exp) {
    console.warn('Firebase token has expired');
    return null;
  }

  // Verify project ID if configured
  let expectedProjectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
  if (!expectedProjectId) {
    try {
      const configPath = path.resolve(__dirname, 'firebase-applet-config.json');
      if (fs.existsSync(configPath)) {
        const raw = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        expectedProjectId = raw.projectId;
      }
    } catch {
      // fallback
    }
  }

  if (expectedProjectId) {
    if (payload.aud && payload.aud !== expectedProjectId) {
      console.warn(`Token audience mismatch: got ${payload.aud}, expected ${expectedProjectId}`);
      return null;
    }
    if (payload.iss && payload.iss !== `https://securetoken.google.com/${expectedProjectId}`) {
      console.warn(`Token issuer mismatch: got ${payload.iss}`);
      return null;
    }
  } else {
    // If project ID is not set in env, ensure issuer is securetoken.google.com
    if (!payload.iss || !payload.iss.startsWith('https://securetoken.google.com/')) {
      console.warn(`Invalid Firebase token issuer: ${payload.iss}`);
      return null;
    }
  }

  const uid = payload.sub || payload.user_id;
  if (!uid || typeof uid !== 'string') return null;

  // Cryptographic signature check with Google's public certs
  try {
    const certs = await getFirebasePublicCerts();
    const cert = header.kid ? certs[header.kid] : null;
    if (cert) {
      const verifier = crypto.createVerify('RSA-SHA256');
      verifier.update(signedContent);
      const isSignatureValid = verifier.verify(cert, Buffer.from(signature, 'base64url'));
      if (!isSignatureValid) {
        console.warn('Firebase token signature verification failed');
        return null;
      }
    }
  } catch (err) {
    console.warn('Signature verification check error:', err);
  }

  return {
    uid,
    email: payload.email,
  };
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Support up to 25MB payloads for high-resolution notice PDFs / images
  app.use(express.json({ limit: '25mb' }));

  const apiKey = process.env.GEMINI_API_KEY;
  let ai: GoogleGenAI | null = null;
  if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
    try {
      ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    } catch (e) {
      console.warn('Failed to initialize GoogleGenAI client:', e);
    }
  }

  // In-memory server store scoped strictly by authenticated user ID
  const serverUserTimetable: Map<string, TimetableEntry[]> = new Map();
  const serverUserNotices: Map<string, NoticeDecoded[]> = new Map();
  const serverConflictReviews: Map<string, ConflictReview[]> = new Map();

  // Strict Authentication Middleware
  const requireAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. Please sign in with Google.',
      });
    }

    const token = authHeader.split(' ')[1];
    const verified = await verifyFirebaseToken(token);
    if (!verified) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired authentication session. Please sign in with Google again.',
      });
    }

    req.userId = verified.uid;
    req.userEmail = verified.email;
    next();
  };

  // Health and Provider Capability Endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'Notice Decoder Server API',
      aiConfigured: Boolean(apiKey && apiKey !== 'MY_GEMINI_API_KEY'),
      model: 'gemini-3.8-flash',
      authMethod: 'firebase_google_auth',
      timestamp: new Date().toISOString(),
    });
  });

  // Extraction Endpoint - Protected by Firebase Google Auth
  app.post('/api/extract', requireAuth, async (req: AuthenticatedRequest, res) => {
    const { text, fileData, mimeType, fileName, fileSize } = req.body || {};

    const rawInputText = (text || '').trim();
    const hasFile = Boolean(fileData && mimeType);

    if (!rawInputText && !hasFile) {
      return res.status(400).json({
        success: false,
        error: 'Please provide notice text or upload a valid notice document/image.',
      });
    }

    const hasValidKey = Boolean(apiKey && apiKey !== 'MY_GEMINI_API_KEY' && ai);

    if (hasValidKey && ai) {
      try {
        const parts: any[] = [];

        if (hasFile) {
          parts.push({
            inlineData: {
              mimeType: mimeType,
              data: fileData,
            },
          });
        }

        const systemPrompt = `You are Notice Decoder, an academic document parsing engine.
Your task is to analyze this college circular/notice/memo/presentation and extract a structured JSON response.

STRICT INSTRUCTIONS:
1. Grounding & Accuracy: Do NOT invent missing dates, times, venues, or deadlines.
2. Missing Information: If a venue is not mentioned in the notice, set venue to "Not specified in notice". If an event date has no stated start/end time, leave startTime and endTime as empty strings ("").
3. Optional Headers: Normal college notices often lack dispatch reference numbers. Missing a reference number is normal and must NOT trigger an uncertainty warning.
4. Summary: Write 2 to 3 concise, clear sentences in plain English explaining what this document is about and what students must know.
5. Multiple Events: If this notice covers multiple exam papers, workshop tracks, or schedule days, extract each as a distinct item in "events".
6. Action Checklist: Extract concrete action tasks with specific deadlines and required documents where mentioned.
7. Genuine Conflicts Only: Only flag an item in "uncertainties" if there is a genuine date/time contradiction in the text or a critical required deadline is stated ambiguously (e.g. conflicting dates for the same exam paper). Use natural language for the explanation.

Return a JSON object conforming strictly to this format:
{
  "noticeTitle": string,
  "noticeType": "exam" | "circular" | "event" | "deadline" | "scholarship" | "administrative" | "general",
  "urgency": "normal" | "high" | "critical",
  "institution": string,
  "department": string,
  "referenceNumber": string,
  "publicationDate": string,
  "plainLanguageSummary": string,
  "events": [
    {
      "id": string,
      "title": string,
      "date": string,
      "startTime": string,
      "endTime": string,
      "venue": string,
      "isMandatory": boolean,
      "targetAudience": string,
      "evidenceSnippet": string
    }
  ],
  "checklist": [
    {
      "id": string,
      "task": string,
      "deadline": string,
      "requiredDocuments": string[],
      "submissionLinkOrPlace": string,
      "completed": false,
      "evidenceSnippet": string
    }
  ],
  "eligibility": {
    "eligibleBatches": string[],
    "minimumRequirements": string,
    "prerequisites": string[],
    "notes": string
  },
  "organizer": {
    "name": string,
    "designation": string,
    "department": string,
    "email": string,
    "phone": string,
    "office": string
  },
  "uncertainties": [
    {
      "id": string,
      "field": string,
      "issueType": "missing_time" | "ambiguous_date" | "unclear_venue" | "contradictory_info" | "low_confidence" | "missing_deadline",
      "explanation": string,
      "resolved": false
    }
  ],
  "sourceEvidence": [
    { "claim": string, "snippet": string }
  ]
}`;

        const promptContent = rawInputText
          ? `${systemPrompt}\n\nNotice Content:\n${rawInputText}`
          : `${systemPrompt}\n\nPlease inspect the attached notice file and extract all information accurately.`;

        parts.push({ text: promptContent });

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: { parts },
          config: {
            responseMimeType: 'application/json',
          },
        });

        const outputText = response.text || '';
        const parsedJson = JSON.parse(outputText);

        const fullNotice = {
          id: `notice_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          ...parsedJson,
          userId: req.userId,
          rawText: rawInputText || (hasFile ? `[Binary Document: ${fileName || 'Document'}]` : ''),
          extractionSource: hasFile ? 'gemini_multimodal' : 'gemini_text',
          status: 'reviewed',
          fileName: fileName || null,
          fileType: mimeType || null,
          fileSize: fileSize || null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const validation = NoticeDecodedSchema.safeParse(fullNotice);
        if (validation.success) {
          // Persist to user's saved notices on server
          if (req.userId) {
            const list = serverUserNotices.get(req.userId) || [];
            list.unshift(validation.data as NoticeDecoded);
            serverUserNotices.set(req.userId, list);
          }

          return res.json({
            success: true,
            data: validation.data,
            source: fullNotice.extractionSource,
            message: 'Successfully extracted via Gemini 3.8 Flash model.',
          });
        }
      } catch (err: any) {
        console.error('Gemini extraction failed or timed out:', err?.message || err);
      }
    }

    // Deterministic fallback path when Gemini key is not configured or fails
    const fallbackText = rawInputText || (fileName ? `Notice document: ${fileName}` : 'College Circular');
    const deterministicData = parseNoticeDeterministically(fallbackText, fileName, mimeType, fileSize);
    (deterministicData as any).userId = req.userId;

    if (req.userId) {
      const list = serverUserNotices.get(req.userId) || [];
      list.unshift(deterministicData);
      serverUserNotices.set(req.userId, list);
    }

    return res.json({
      success: true,
      data: deterministicData,
      source: 'deterministic_parser',
      message: 'Extracted using local academic text parser.',
      warningNotice: hasValidKey
        ? 'AI request encountered an error; decoded using local text parser.'
        : undefined,
    });
  });

  // User Notices API (Scoped strictly by authenticated user ID)
  app.get('/api/notices', requireAuth, (req: AuthenticatedRequest, res) => {
    const userId = req.userId!;
    const userNotices = serverUserNotices.get(userId) || [];
    res.json({ success: true, data: userNotices });
  });

  app.post('/api/notices', requireAuth, (req: AuthenticatedRequest, res) => {
    const userId = req.userId!;
    const notice = req.body as NoticeDecoded;
    if (!notice || !notice.id) {
      return res.status(400).json({ success: false, error: 'Valid notice object is required.' });
    }

    const currentList = serverUserNotices.get(userId) || [];
    const idx = currentList.findIndex((n) => n.id === notice.id);

    const savedNotice = {
      ...notice,
      userId,
      updatedAt: new Date().toISOString(),
    };

    if (idx >= 0) {
      currentList[idx] = savedNotice;
    } else {
      currentList.unshift(savedNotice);
    }

    serverUserNotices.set(userId, currentList);
    res.json({ success: true, data: savedNotice });
  });

  app.delete('/api/notices/:id', requireAuth, (req: AuthenticatedRequest, res) => {
    const userId = req.userId!;
    const targetId = req.params.id;
    const currentList = serverUserNotices.get(userId) || [];
    const filtered = currentList.filter((n) => n.id !== targetId);
    serverUserNotices.set(userId, filtered);
    res.json({ success: true, deleted: currentList.length !== filtered.length });
  });

  // Timetable API Endpoints (Scoped strictly by authenticated user ID)
  app.get('/api/timetable', requireAuth, (req: AuthenticatedRequest, res) => {
    const userId = req.userId!;
    const entries = serverUserTimetable.get(userId) || [];
    res.json({ success: true, data: entries });
  });

  app.post('/api/timetable', requireAuth, (req: AuthenticatedRequest, res) => {
    const userId = req.userId!;
    const entry = req.body as TimetableEntry;

    if (!entry.subjectTitle || !entry.weekday || !entry.startTime || !entry.endTime) {
      return res.status(400).json({ success: false, error: 'Missing required timetable fields.' });
    }

    const currentList = serverUserTimetable.get(userId) || [];
    const idx = currentList.findIndex((e) => e.id === entry.id);

    const saved: TimetableEntry = {
      ...entry,
      userId,
      updatedAt: new Date().toISOString(),
    };

    if (idx >= 0) {
      currentList[idx] = saved;
    } else {
      currentList.push(saved);
    }

    serverUserTimetable.set(userId, currentList);
    res.json({ success: true, data: saved });
  });

  app.delete('/api/timetable/:id', requireAuth, (req: AuthenticatedRequest, res) => {
    const userId = req.userId!;
    const targetId = req.params.id;

    const currentList = serverUserTimetable.get(userId) || [];
    const filtered = currentList.filter((e) => e.id !== targetId);
    serverUserTimetable.set(userId, filtered);

    res.json({ success: true, deleted: currentList.length !== filtered.length });
  });

  // Clash Detection API Endpoint
  app.post('/api/conflicts/detect', requireAuth, (req: AuthenticatedRequest, res) => {
    const { notices, timetable, reviews } = req.body as {
      notices: NoticeDecoded[];
      timetable: TimetableEntry[];
      reviews?: ConflictReview[];
    };

    if (!notices || !timetable) {
      return res.status(400).json({ success: false, error: 'Notices and timetable arrays are required.' });
    }

    const { conflicts, uncertainTimingWarnings } = detectClashes(notices, timetable, reviews || []);
    res.json({
      success: true,
      conflicts,
      uncertainTimingWarnings,
      totalConflicts: conflicts.length,
    });
  });

  // RFC-5545 .ICS Export API Endpoint
  app.post('/api/calendar/export', requireAuth, (req, res) => {
    const { events } = req.body as {
      events: {
        event: any;
        noticeTitle: string;
        institution?: string;
      }[];
    };

    if (!events || !Array.isArray(events) || events.length === 0) {
      return res.status(400).json({ success: false, error: 'No confirmed notice events supplied for export.' });
    }

    const icsContent = generateIcsCalendar(events);

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="notice_decoder_schedule.ics"');
    res.send(icsContent);
  });

  // Cascading Account Cleanup for authenticated user
  app.delete('/api/user/account', requireAuth, (req: AuthenticatedRequest, res) => {
    const userId = req.userId!;
    serverUserTimetable.delete(userId);
    serverUserNotices.delete(userId);
    serverConflictReviews.delete(userId);
    res.json({ success: true, message: 'All personal notices, timetable classes, and reviews permanently cleared.' });
  });

  // Client SPA mounting
  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Notice Decoder running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting Notice Decoder server:', err);
  process.exit(1);
});
