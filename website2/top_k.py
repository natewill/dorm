import sys
import json
import pymongo
from scipy import spatial
import numpy as np
import certifi
from pymongo.mongo_client import MongoClient

# Read the input from stdin
data_input = sys.stdin.read()
data_array = json.loads(data_input[1:-3])#get rid of the leading " and the trailing \n" then turn it into an array
query_embedding = data_array
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


cluster = MongoClient("mongodb+srv://Nate:admin@dormie.0whqn7z.mongodb.net/?retryWrites=true&w=majority&appName=Dormie", tlsCAFile=certifi.where())
database = cluster['Dormie']
collection = database['user_data3']

user_array = collection.find() #get every user's embedding (including the user we're using to query)


user = []
embeddings = []
for doc in user_array:
    #put the embeddings into an array and the usernames into an array
    if isinstance(doc["data"], str):
        # Convert JSON string to Python list
        embeddings.append(json.loads(doc["data"]))
        user.append(doc["username"])

distances = distances_from_embeddings(query_embedding, embeddings, distance_metric="cosine") #calculate the distances
import numpy as np

def indices_of_nearest_neighbors_from_distances(distances) -> np.ndarray:
    return np.argsort(distances)

indices_of_nearest_neighbors = indices_of_nearest_neighbors_from_distances(distances) #get the indices of the nearest neighbors

print([user[x] for x in indices_of_nearest_neighbors], flush=True) #print the usernames ranked by closeness to the query username
