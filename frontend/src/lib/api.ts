const rawBase = import.meta.env.VITE_API_BASE_URL?.toString().trim().replace(/\/$/, '') || '';
const API_BASE_URL = rawBase === '' ? '' : rawBase;

const withBase = (path: string) => `${API_BASE_URL}${path}`;

const toError = async (response: Response) => {
  const text = await response.text();
  try {
    const j = JSON.parse(text);
    return new Error(j.detail || text || `Request failed with status ${response.status}`);
  } catch {
    return new Error(text || `Request failed with status ${response.status}`);
  }
};

function headers(token?: string): HeadersInit {
  const h: HeadersInit = {};
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

export type UploadResult = { message?: string };
export type QueryResult = { answer: string; sources?: Array<Record<string, unknown>> };
export type AuthResult = { access_token: string; token_type: string };

export async function login(email: string, password: string): Promise<AuthResult> {
  const response = await fetch(withBase('/auth/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) throw await toError(response);
  return response.json() as Promise<AuthResult>;
}

export async function signup(email: string, password: string): Promise<AuthResult> {
  const response = await fetch(withBase('/auth/signup'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) throw await toError(response);
  return response.json() as Promise<AuthResult>;
}

export async function uploadDocument(file: File, token?: string): Promise<UploadResult> {
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
    headers: headers(token),
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

export async function askQuestion(question: string, topK = 4, token?: string): Promise<QueryResult> {
  const formData = new FormData();
  formData.append('question', question);
  formData.append('top_k', String(topK));

  const response = await fetch(withBase('/query'), {
    method: 'POST',
    headers: headers(token),
    body: formData,
  });

  if (!response.ok) {
    throw await toError(response);
  }

  return (await response.json()) as QueryResult;
}
