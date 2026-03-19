import Anthropic from '@anthropic-ai/sdk';
import { randomUUID } from 'crypto';

// Give the AI call up to 60 s on Vercel (Hobby plan max)
export const config = { maxDuration: 60 };

const client = new Anthropic(); // reads ANTHROPIC_API_KEY from Vercel env

const COLORS = ['indigo', 'violet', 'blue', 'emerald', 'amber', 'rose', 'teal', 'orange', 'pink', 'cyan'];

function letterToPercentage(letter: string): number | null {
  const map: Record<string, number> = {
    'A+': 98, 'A': 95,  'A-': 91,
    'B+': 88, 'B': 85,  'B-': 81,
    'C+': 78, 'C': 75,  'C-': 71,
    'D+': 68, 'D': 65,  'D-': 61,
    'F':  50,
    'P':  100, 'NP': 50,
  };
  return map[letter?.trim().toUpperCase()] ?? null;
}

interface TranscriptCourse {
  code: string;
  name: string;
  credits: number;
  letterGrade: string;
  gradePercentage: number | null;
}

interface TranscriptTerm {
  name: string;
  courses: TranscriptCourse[];
}

const PROMPT = `You are extracting data from a university transcript. Return ONLY valid JSON — no markdown fences, no explanation, nothing else.

JSON format:
{
  "terms": [
    {
      "name": "Fall 2023",
      "courses": [
        {
          "code": "CS 101",
          "name": "Introduction to Computer Science",
          "credits": 3,
          "letterGrade": "A",
          "gradePercentage": 95
        }
      ]
    }
  ]
}

Rules:
- Use the exact term name from the transcript (e.g. "Fall 2023", "Spring 2024", "Summer 2024")
- letterGrade: use the grade exactly as shown (A+/A/A-/B+/B/B-/C+/C/C-/D+/D/D-/F/P/NP/W/I)
- gradePercentage: A+=98, A=95, A-=91, B+=88, B=85, B-=81, C+=78, C=75, C-=71, D+=68, D=65, D-=61, F=50, P=100, NP=50; use null for W (withdrawn) or I (incomplete)
- credits: number (use 3 if not listed)
- If no course code is visible, create one from the first letters of the course name
- Sort terms chronologically, oldest first
- Omit courses with grade W (withdrawn) entirely`;

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { base64, mimeType } = req.body ?? {};

  if (!base64 || !mimeType) {
    return res.status(400).json({ error: 'Missing base64 or mimeType in request body' });
  }

  const isPDF = mimeType === 'application/pdf';
  const isImage = (mimeType as string).startsWith('image/');

  if (!isPDF && !isImage) {
    return res.status(400).json({ error: 'File must be a PDF or image (JPG, PNG, WEBP)' });
  }

  try {
    const content: Anthropic.MessageParam['content'] = isPDF
      ? [
          {
            type: 'document',
            source: { type: 'base64', media_type: 'application/pdf', data: base64 },
          } as Anthropic.DocumentBlockParam,
          { type: 'text', text: PROMPT },
        ]
      : [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
              data: base64,
            },
          },
          { type: 'text', text: PROMPT },
        ];

    const createParams = {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [{ role: 'user' as const, content }],
    };

    const response = isPDF
      ? await client.messages.create(createParams, {
          headers: { 'anthropic-beta': 'pdfs-2024-09-25' },
        })
      : await client.messages.create(createParams);

    const textBlock = response.content.find(b => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      return res.status(500).json({ error: 'No response from AI' });
    }

    let jsonText = textBlock.text.trim();
    const fenceMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) jsonText = fenceMatch[1].trim();

    const parsed = JSON.parse(jsonText) as { terms: TranscriptTerm[] };

    const terms = [];
    const courses = [];
    let colorIndex = 0;

    for (const term of parsed.terms) {
      const termId = randomUUID();
      terms.push({ id: termId, name: term.name, isActive: false });

      for (const course of term.courses) {
        if (course.gradePercentage === null) continue;

        const pct = course.gradePercentage ?? letterToPercentage(course.letterGrade);
        courses.push({
          id: randomUUID(),
          name: course.name,
          code: course.code || course.name.replace(/\s+/g, '').slice(0, 8).toUpperCase(),
          term: term.name,
          creditHours: course.credits || 3,
          targetGrade: null,
          finalGradeOverride: pct,
          isPassFail: ['P', 'NP'].includes((course.letterGrade ?? '').toUpperCase()),
          color: COLORS[colorIndex % COLORS.length],
        });
        colorIndex++;
      }
    }

    return res.json({ terms, courses, assignments: [] });
  } catch (err) {
    console.error('Transcript parse error:', err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Failed to parse transcript',
    });
  }
}
