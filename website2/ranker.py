from pinecone import Pinecone, ServerlessSpec
import os
from openai import OpenAI 
pc = Pinecone(api_key=os.getenv('PINECONE_API_KEY'))

index_name = "ranker"
pc.create_index(
    name=index_name,
    dimension=8, # Replace with your model dimensions
    metric="cosine", # Replace with your model metric
    spec=ServerlessSpec(
        cloud="aws",
        region="us-east-1"
    ) 
)

index = pc.Index(index_name)
client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
def get_embedding(text, model="text-embedding-3-small"):
   return client.embeddings.create(input = [text], model=model).data[0].embedding
#NAME, HOBBIES/LOCATION

from pymongo import MongoClient
mongodb_client = MongoClient(os.getenv("MONGO_URI"))
database = mongodb_client["Dormie"]
print(database)

import json
people_json = [json.dumps(x) for x in people]
people_json
embeddings = [get_embedding(x) for x in people_json]
len(embeddings)
query_embdedding = embeddings[1]
from typing import List, Optional
from scipy import spatial

def distances_from_embeddings(
    query_embedding: List[float],
    embeddings: List[List[float]],
    distance_metric="cosine",
) -> List[List]:
    distance_metrics = {
        "cosine": spatial.distance.cosine,
        "L1": spatial.distance.cityblock,
        "L2": spatial.distance.euclidean,
        "Linf": spatial.distance.chebyshev,
    }
    distances = [
        distance_metrics[distance_metric](query_embedding, embedding)
        for embedding in embeddings
    ]
    return distances
distances = distances_from_embeddings(query_embdedding, embeddings, distance_metric="cosine")
import numpy as np

def indices_of_nearest_neighbors_from_distances(distances) -> np.ndarray:
    """Return a list of indices of nearest neighbors from a list of distances."""
    return np.argsort(distances)
indices_of_nearest_neighbors = indices_of_nearest_neighbors_from_distances(distances)
indices_of_nearest_neighbors

