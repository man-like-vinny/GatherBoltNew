const mongoose=require('mongoose')

mongoose.connect("mongodb+srv://vinayakunnithan:Vinayak1@gather.fgw0v5i.mongodb.net/?retryWrites=true&w=majority")
.then(() => {
    console.log("MongoDB Connected!");
})

.catch(()=>{
    console.log("error");
})

const tutSchema=new mongoose.Schema({

    name:{
        type: String,
        required: true
    }
})

const collection=new mongoose.model('tut', tutSchema)

data = {
    name: "Vinayak"
}
collection.insertMany(data)

