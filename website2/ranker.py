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