import faiss
import numpy as np
import os
import pickle


class VectorStore:
    def __init__(self, index_path: str = "data/faiss_index"):
        self.index_path = index_path
        self.index = None
        self.metadata = []

        # Ensure directory exists (supports per-user paths e.g. storage/users/<id>/vectors/)
        index_dir = os.path.dirname(index_path)
        if index_dir:
            os.makedirs(index_dir, exist_ok=True)

        if os.path.exists(index_path):
            self.load_index()

    # --------------------------------------------

    def create_index(self, dimension: int):
        self.index = faiss.IndexFlatL2(dimension)
        self.metadata = []

    # --------------------------------------------

    def add_embeddings(self, embeddings, chunks):
        vectors = np.array(embeddings).astype("float32")

        if self.index is None:
            self.create_index(vectors.shape[1])

        self.index.add(vectors)

        for chunk in chunks:
            # store only serializable metadata (avoid embeddings in responses)
            cleaned = {k: v for k, v in chunk.items() if k != "embedding"}
            self.metadata.append(cleaned)

        self.save_index()

    # --------------------------------------------

    def search(self, query_vector, top_k=4):
        if self.index is None or not self.metadata:
            return []

        query_vector = np.array([query_vector]).astype("float32")

        distances, indices = self.index.search(query_vector, top_k)

        results = []
        for i in indices[0]:
            if i < len(self.metadata):
                item = self.metadata[i]
                if isinstance(item, dict) and "embedding" in item:
                    item = {k: v for k, v in item.items() if k != "embedding"}
                results.append(item)

        return results

    # --------------------------------------------

    def save_index(self):
        faiss.write_index(self.index, self.index_path)

        with open(self.index_path + "_meta.pkl", "wb") as f:
            pickle.dump(self.metadata, f)

    # --------------------------------------------

    def load_index(self):
        self.index = faiss.read_index(self.index_path)

        with open(self.index_path + "_meta.pkl", "rb") as f:
            self.metadata = pickle.load(f)
