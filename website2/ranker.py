from pinecone import Pinecone, ServerlessSpec
import os
from openai import OpenAI 
import sys
pc = Pinecone(api_key=os.getenv('PINECONE_API_KEY'))

index_name = "ranker"
index = pc.Index(index_name)
client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
def get_embedding(text, model="text-embedding-3-small"):
   return client.embeddings.create(input = [text], model=model).data[0].embedding
#NAME, HOBBIES/LOCATION

import json
data_array = json.loads(sys.argv[1])
people_json = json.dumps(data_array)
embeddings = get_embedding(people_json)

print(embeddings)

"""
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
    Return a list of indices of nearest neighbors from a list of distances.
    return np.argsort(distances)
indices_of_nearest_neighbors = indices_of_nearest_neighbors_from_distances(distances)
indices_of_nearest_neighbors
"""
