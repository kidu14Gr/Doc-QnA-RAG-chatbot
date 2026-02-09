def build_rag_prompt(question: str, context: str) -> str:
    """
    Smart dual-mode prompt:
    - Answer from context if relevant
    - Otherwise behave as normal assistant
    """

    context = context.strip()
    question = question.strip()

    return f"""
You are an intelligent assistant with TWO MODES:

MODE 1 – DOCUMENT MODE
If the question is related to the provided context:
- Answer ONLY using that context
- Cite like [source 1], [source 2]
- Do NOT invent information

MODE 2 – GENERAL MODE
If the question is NOT related to the document:
- Answer normally using your general knowledge
- Do NOT pretend it came from the document

--------------------------------
CONTEXT FROM DOCUMENT:
{context if context else "NO DOCUMENT CONTEXT AVAILABLE"}

USER QUESTION:
{question}

ANSWER:
"""