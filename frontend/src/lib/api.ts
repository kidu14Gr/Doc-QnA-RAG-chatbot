const rawBase = import.meta.env.VITE_API_BASE_URL?.toString().trim().replace(/\/$/, '') || '';
const API_BASE_URL = rawBase === '' ? '' : rawBase;

const withBase = (path: string) => `${API_BASE_URL}${path}`;

const toError = async (response: Response) => {
  const text = await response.text();
  return new Error(text || `Request failed with status ${response.status}`);
};

export type UploadResult = { message?: string };
export type QueryResult = { answer: string; sources?: Array<Record<string, unknown>> };

export async function uploadDocument(file: File): Promise<UploadResult> {
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  const isDocx =
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    file.name.toLowerCase().endsWith('.docx');

  if (!isPdf && !isDocx) {
    throw new Error('Only PDF or DOCX files are supported.');
  }

  const endpoint = isPdf ? '/upload/pdf' : '/upload/docx';
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(withBase(endpoint), {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw await toError(response);
  }

  try {
    return (await response.json()) as UploadResult;
  } catch (error) {
    return {};
  }
}

export async function askQuestion(question: string, topK = 4): Promise<QueryResult> {
  const formData = new FormData();
  formData.append('question', question);
  formData.append('top_k', String(topK));

  const response = await fetch(withBase('/query'), {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw await toError(response);
  }

  return (await response.json()) as QueryResult;
}
