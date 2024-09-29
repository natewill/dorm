import sys
import json
data_array = json.loads(sys.argv[1])
query_embdedding = data_array['data']
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

from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
import pymongo
import certifi
import os


cluster = MongoClient(os.getenv("MONGO_URI"), tlsCAFile=certifi.where())
database = cluster['Dormie']
collection = database['user_data3']

user_array = list(collection.find({}))
embeddings = [doc["data"] for doc in user_array]


distances = distances_from_embeddings(query_embdedding, embeddings, distance_metric="cosine")
import numpy as np

def indices_of_nearest_neighbors_from_distances(distances) -> np.ndarray:
    """Return a list of indices of nearest neighbors from a list of distances."""
    return np.argsort(distances)
indices_of_nearest_neighbors = indices_of_nearest_neighbors_from_distances(distances)
print([embeddings[x] for x in indices_of_nearest_neighbors])