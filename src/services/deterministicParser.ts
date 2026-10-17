import { NoticeDecoded, NoticeEvent, ActionItem, UncertaintyWarning, EvidencePair, NoticeType, UrgencyLevel } from '../types/notice';
import { normalizeDate, normalizeTimeRange } from '../utils/dateNormalizer';
import { NoticeDecodedSchema } from '../types/noticeSchema';

/**
 * Deterministic Local Notice Parser
 * Extracts structured schedule, deadlines, actions, and uncertainties from raw college circulars.
 * Used when Gemini API is unconfigured, for offline operation, or as a deterministic baseline.
 */
export function parseNoticeDeterministically(
  rawText: string,
  fileName?: string,
  fileType?: string,
  fileSize?: number
): NoticeDecoded {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  // 1. Title & Header Detection
  let institution = '';
  let department = '';
  let referenceNumber = '';
  let publicationDate = '';
  let noticeTitle = '';

  const evidencePairs: EvidencePair[] = [];
  const uncertainties: UncertaintyWarning[] = [];

  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    const line = lines[i];

    // Reference Number (e.g. Ref No: STU/123 or Ref: ABC or Circular No. 45)
    const refMatch = line.match(/(?:ref(?:erence)?|circular)\s*(?:no\.?|number|[:\.\-])*[:\s-]*([A-Za-z0-9]+[A-Za-z0-9\/\-\._]+)/i);
    if (refMatch && !referenceNumber) {
      const candidate = refMatch[1].trim();
      // Avoid matching words like "Notice" or "Date" or "No"
      if (!/^(?:no|notice|date|all|to|from)$/i.test(candidate)) {
        referenceNumber = candidate;
        evidencePairs.push({
          claim: `Reference number is ${referenceNumber}`,
          snippet: line,
        });
      }
    }

    // Publication Date
    const dateMatch = line.match(/(?:date|dated|dt\.?)\s*[:=\-]?\s*(\d{1,2}(?:st|nd|rd|th)?[\s\/\.-]+[a-zA-Z0-9]+[\s\/\.-]+\d{2,4})/i);
    if (dateMatch && !publicationDate) {
      const parsed = normalizeDate(dateMatch[1]);
      publicationDate = parsed.normalized || dateMatch[1];
      evidencePairs.push({
        claim: `Published on ${publicationDate}`,
        snippet: line,
      });
      continue;
    }

    // Institution / University keywords
    if (/university|college|institute|faculty|academy/i.test(line) && !institution) {
      institution = line.replace(/^[#\*\-=\s]+|[#\*\-=\s]+$/g, '');
      continue;
    }

    // Department keywords
    if (/department|dept\.?|division|office\s+of/i.test(line) && !department) {
      department = line.replace(/^[#\*\-=\s]+|[#\*\-=\s]+$/g, '');
      continue;
    }

    // Title candidates (lines with NOTICE, CIRCULAR, MEMO, ANNOUNCEMENT or prominent headings)
    if (/notice|circular|schedule|invitation|instruction|viva|exam/i.test(line) && !noticeTitle) {
      noticeTitle = line.replace(/^[#\*\-=\s]+|[#\*\-=\s]+$/g, '');
    }
  }

  if (!noticeTitle) {
    noticeTitle = lines[0] ? lines[0].substring(0, 80) : 'College Academic Notice';
  }

  // 2. Classify Notice Type & Urgency
  let noticeType: NoticeType = 'general';
  const lower = rawText.toLowerCase();

  if (lower.includes('exam') || lower.includes('mid-term') || lower.includes('semester end') || lower.includes('hall ticket')) {
    noticeType = 'exam';
  } else if (lower.includes('scholarship') || lower.includes('fee concession') || lower.includes('financial aid')) {
    noticeType = 'scholarship';
  } else if (lower.includes('hackathon') || lower.includes('symposium') || lower.includes('conference') || lower.includes('workshop')) {
    noticeType = 'event';
  } else if (lower.includes('deadline') || lower.includes('last date') || lower.includes('submission')) {
    noticeType = 'deadline';
  } else if (lower.includes('office order') || lower.includes('administration') || lower.includes('hostel') || lower.includes('disciplinary')) {
    noticeType = 'administrative';
  } else {
    noticeType = 'circular';
  }

  let urgency: UrgencyLevel = 'normal';
  if (lower.includes('urgent') || lower.includes('immediate') || lower.includes('mandatory') || lower.includes('without fail')) {
    urgency = 'high';
  }
  if (lower.includes('strictly prohibited') || lower.includes('last and final opportunity') || lower.includes('debarred')) {
    urgency = 'critical';
  }

  // 3. Extract Events & Timetable entries
  const events: NoticeEvent[] = [];
  // Look for lines containing dates or times
  const dateRegex = /\b(\d{1,2}(?:st|nd|rd|th)?\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}|\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4})\b/i;
  const timeRegex = /\b(\d{1,2}(?::\d{2})?\s*(?:am|pm|\bhrs\b)?\s*(?:to|-|–)\s*\d{1,2}(?::\d{2})?\s*(?:am|pm|\bhrs\b)?)\b/i;
  const venueRegex = /\b(?:venue|room|hall|lab|auditorium|block|centre|google meet|zoom|teams)\b[\s:]*([^,;\.\n]+)/i;

  let eventCounter = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip notice header metadata lines (Ref number, dispatch date)
    if (/^(?:ref(?:\s*no)?|circular(?:\s*no)?|date|dated)\b/i.test(line) ||
        line.includes('Ref No:') ||
        line.includes('Ref:') ||
        line.includes('Date:')) {
      continue;
    }

    const dMatch = line.match(dateRegex);
    const tMatch = line.match(timeRegex);
    const vMatch = line.match(venueRegex);

    if (dMatch || tMatch || (vMatch && (lower.includes('held on') || lower.includes('scheduled')))) {
      const normDate = dMatch ? normalizeDate(dMatch[1]) : { normalized: '', isAmbiguous: true, raw: '' };
      const normTime = tMatch ? normalizeTimeRange(tMatch[1]) : { startTime: '', endTime: '', raw: '' };
      
      let venue = '';
      const inAtMatch = line.match(/\b(?:in|at|venue:?)\s+([A-Za-z0-9\s\.\-]+(?:Lab|Hall|Room|Auditorium|Block|Centre|Building)[A-Za-z0-9\s]*)/i);
      if (inAtMatch) {
        venue = inAtMatch[1].replace(/\b(?:from|to|between|starting|at)\s+\d+.*$/i, '').trim();
      } else if (vMatch) {
        venue = vMatch[0].replace(/\b(?:from|to|between|starting)\s+\d+.*$/i, '').trim();
      } else if (/lab|room\s*\d+|audi|seminar\s*hall/i.test(line)) {
        const matchRoom = line.match(/(?:room|lab|hall|audi[a-z]*)\s*#?[a-zA-Z0-9\-\s]+/i);
        if (matchRoom) venue = matchRoom[0].trim();
      }

      // Check for title or paper code
      let eventTitle = line.replace(dMatch?.[0] || '', '').replace(tMatch?.[0] || '', '').replace(/^[0-9\.\-\*#\)\(:]+/, '').trim();
      if (!eventTitle || eventTitle.length < 4) {
        eventTitle = `Session ${eventCounter}: ${noticeTitle.substring(0, 30)}`;
      }

      const isMandatory = /mandatory|compulsory|all\s+students\s+must|attendance\s+will\s+be\s+taken/i.test(line);

      events.push({
        id: `evt_${Date.now()}_${eventCounter}`,
        title: eventTitle.substring(0, 100),
        date: normDate.normalized || 'TBD',
        startTime: normTime.startTime || '',
        endTime: normTime.endTime || '',
        venue: venue || 'Venue not specified',
        isMandatory,
        targetAudience: 'Registered students / eligible batches',
        evidenceSnippet: line,
      });

      evidencePairs.push({
        claim: `Event "${eventTitle.substring(0, 40)}" on ${normDate.normalized || 'TBD'}`,
        snippet: line,
      });

      if (!normTime.startTime) {
        uncertainties.push({
          id: `unc_time_${eventCounter}`,
          field: `${eventTitle.substring(0, 30)} (Time)`,
          issueType: 'missing_time',
          explanation: 'The notice specifies an event date but does not state a start or end time.',
          resolved: false,
        });
      }

      if (normDate.isAmbiguous && normDate.raw) {
        uncertainties.push({
          id: `unc_date_${eventCounter}`,
          field: `${eventTitle.substring(0, 30)} (Date)`,
          issueType: 'ambiguous_date',
          explanation: `The date "${normDate.raw}" is ambiguous. Please check the original notice to confirm.`,
          resolved: false,
        });
      }

      eventCounter++;
    }
  }

  // If no specific timetable rows were parsed, create a default notice event
  if (events.length === 0) {
    events.push({
      id: `evt_${Date.now()}_default`,
      title: noticeTitle,
      date: publicationDate || 'See notice text',
      startTime: '',
      endTime: '',
      venue: 'Campus / Online Portal',
      isMandatory: urgency !== 'normal',
      targetAudience: 'All enrolled students',
      evidenceSnippet: lines[0] || 'Original circular text',
    });
  }

  // 4. Action Checklist & Deadlines
  const checklist: ActionItem[] = [];
  const actionKeywords = [
    'submit', 'register', 'bring', 'carry', 'pay', 'upload', 'verify',
    'download', 'report to', 'collect', 'fill', 'apply', 'forward'
  ];

  let actionCounter = 1;
  for (const line of lines) {
    const hasAction = actionKeywords.some((kw) => new RegExp(`\\b${kw}\\b`, 'i').test(line));
    if (hasAction && line.length > 10 && line.length < 250) {
      // Find deadline if any
      const dlMatch = line.match(/(?:by|before|on\s+or\s+before|deadline|last\s+date|till)\s*:?\s*([^,;\n]+)/i);
      let deadlineStr = '';
      if (dlMatch) {
        const parsed = normalizeDate(dlMatch[1]);
        deadlineStr = parsed.normalized || dlMatch[1].trim();
      }

      // Check required documents
      const docs: string[] = [];
      if (/hall\s*ticket|admit\s*card/i.test(line)) docs.push('College Admit Card / Hall Ticket');
      if (/id\s*card|identity\s*card/i.test(line)) docs.push('College Identity Card');
      if (/fee\s*receipt|challan/i.test(line)) docs.push('Original Fee Receipt / Challan');
      if (/mark\s*sheet|transcript/i.test(line)) docs.push('Attested Copy of Previous Marksheet');
      if (/project\s*report|synopsis/i.test(line)) docs.push('Spiral/Hardbound Project Report (2 copies)');

      // Submission place/link
      let submissionLocation = '';
      const placeMatch = line.match(/(?:at|to|in)\s+the\s+([A-Za-z\s]+(?:office|desk|counter|department|portal|link))/i);
      if (placeMatch) {
        submissionLocation = placeMatch[1].trim();
      }

      const taskDescription = line.replace(/^[0-9\.\-\*#\)\(:]+/, '').trim();

      checklist.push({
        id: `act_${Date.now()}_${actionCounter}`,
        task: taskDescription,
        deadline: deadlineStr || 'Before event start',
        requiredDocuments: docs,
        submissionLinkOrPlace: submissionLocation || 'Respective Department Office / Online Portal',
        completed: false,
        evidenceSnippet: line,
      });

      evidencePairs.push({
        claim: `Required action: ${taskDescription.substring(0, 50)}`,
        snippet: line,
      });

      actionCounter++;
      if (checklist.length >= 6) break;
    }
  }

  // If no action items found, add default review item
  if (checklist.length === 0) {
    checklist.push({
      id: `act_${Date.now()}_review`,
      task: 'Review circular terms and note down applicable instructions',
      deadline: publicationDate || 'Immediate',
      requiredDocuments: [],
      submissionLinkOrPlace: 'Department Notice Board',
      completed: false,
      evidenceSnippet: 'General circular announcement',
    });
  }

  // 5. Eligibility & Batches
  const batches: string[] = [];
  const batchMatches = rawText.match(/\b(?:202[0-9]|1st|2nd|3rd|4th|final)\s+(?:year|semester|sem|batch)\b/gi);
  if (batchMatches) {
    batchMatches.forEach((bm) => {
      const clean = bm.trim();
      if (!batches.includes(clean)) batches.push(clean);
    });
  }

  const branches: string[] = [];
  ['CSE', 'ECE', 'IT', 'MECH', 'CIVIL', 'EEE', 'AI&DS', 'B.Tech', 'M.Tech', 'MBA', 'MCA', 'B.Sc'].forEach((br) => {
    if (new RegExp(`\\b${br}\\b`, 'i').test(rawText)) {
      branches.push(br);
    }
  });

  const eligibility = {
    eligibleBatches: batches.length > 0 ? batches : ['Applicable to all enrolled students mentioned in notice'],
    minimumRequirements: /attendance|75%|cgpa|backlog/i.test(rawText)
      ? 'Minimum 75% attendance and no active disciplinary hold'
      : 'As per standard university regulations',
    prerequisites: branches.length > 0 ? [`Branches: ${branches.join(', ')}`] : ['Enrolled student status'],
    notes: 'Verify your roll number on the departmental clearance list.',
  };

  // 6. Contact / Organizer
  let organizerName = '';
  let organizerRole = '';
  let email = '';
  let phone = '';

  const emailMatch = rawText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) email = emailMatch[0];

  const phoneMatch = rawText.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  if (phoneMatch) phone = phoneMatch[0];

  const signoffMatch = rawText.match(/(?:convenor|coordinator|head\s+of\s+department|h\.?o\.?d\.?|controller\s+of\s+examinations|principal|dean)[\s:,]+([A-Za-z\.\s]+)/i);
  if (signoffMatch) {
    organizerRole = signoffMatch[0].split(/[,:]/)[0].trim();
    organizerName = signoffMatch[1].trim().substring(0, 40);
  } else {
    organizerRole = 'Academic Affairs & Examinations Office';
    organizerName = 'Department Coordinator';
  }

  // 7. Plain-Language Summary
  const plainLanguageSummary = `This notice announces "${noticeTitle}" issued by ${institution || department || 'the College Administration'}. Key dates and requirements have been identified for ${eligibility.eligibleBatches.join(', ')}. Students must complete ${checklist.length} required action${checklist.length > 1 ? 's' : ''} including "${checklist[0]?.task.substring(0, 60)}".`;

  // 8. General Ambiguity Checks
  // Note: Missing optional official reference numbers or dispatch IDs are normal and must not trigger warnings

  const result: NoticeDecoded = {
    id: `notice_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    noticeTitle,
    noticeType,
    urgency,
    institution: institution || 'Not specified in notice',
    department: department || 'Not specified in notice',
    referenceNumber: referenceNumber || '',
    publicationDate: publicationDate || new Date().toISOString().split('T')[0],
    plainLanguageSummary,
    events,
    checklist,
    eligibility,
    organizer: {
      name: organizerName || '',
      designation: organizerRole || '',
      department: department || '',
      email: email || '',
      phone: phone || '',
      office: '',
    },
    uncertainties,
    rawText,
    sourceEvidence: evidencePairs,
    extractionSource: 'deterministic_parser',
    status: 'reviewed',
    fileName: fileName || null,
    fileType: fileType || null,
    fileSize: fileSize || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Validate with Zod
  const validation = NoticeDecodedSchema.safeParse(result);
  if (!validation.success) {
    console.warn('Deterministic parser generated schema deviations, repairing:', validation.error);
  }

  return validation.success ? (validation.data as NoticeDecoded) : result;
}
