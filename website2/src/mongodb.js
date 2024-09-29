 const { MongoClient, ServerApiVersion } = require('mongodb.js');
//change to require
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(process.env.MONGO_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});



try {
    await client.connect();
    var database = await client.db("Dormie")

    const user_data = await database.collection("user_data")

    } catch (e){
        console.error(e)
    }

    const user_data = new Schema({
        about: String,
        major: String,
        bedtime: String,
        clean: String,
        atmosphere: String
      });


const collection=new mongoose.model("user_data",user_data)

module.exports=collection