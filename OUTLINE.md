

Goals:
1. Create an interactive chatbot that roleplays as an ancient Greek priestess, drawing inspiration and knowledge from A.R. Ammons' poetry and writings.
2. Implement a Retrieval-Augmented Generation (RAG) system to provide context-aware responses based on the content of Ammons' works, filtered through the perspective of an ancient Greek priestess.
3. Utilize Streamlit for the user interface, integrating it with Hugging Face's Transformers library (version 4.29.2) for NLP tasks, and FAISS (version 1.7.4) for efficient similarity search.
4. Implement the system to run in a Python 3.10 environment, using PyTorch (version 2.0.1) as the deep learning framework, with all dependencies specified in a requirements.txt file.
5. Design the application to operate within the constraints of a Hugging Face Space, ensuring compatibility with their serverless environment and adhering to their file system limitations for data persistence.

rag2/
│
├── app.py
├── requirements.txt
├── ammons_muse.txt
└── data/
    ├── chunks_{model_combination}.pkl
    ├── embeddings_{model_combination}.npy
    └── faiss_index_{model_combination}.bin