import mongoose,{Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
const videoSchema=new Schema({
    videoFile:{
        type:String,    //cloudinary
        required:true
    },
    thumbNail:{
        type:String,    //cloudinary
        required:true
    },
    title:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    duration:{
        type:Number, //cloudinary
        required:true
    },
    duration:{
        type:Number, 
        default:0
    },
    isPublished:{
        type:Boolean,
        default:true
    },
    owner:{
        type:Schema.Types.ObjectId,
        ref:"User"
    }
},{timestamps:true})


videoSchema.plugin(mongooseAggregatePaginate)
// mongooseAggregatePaginate is a plugin that allows pagination of aggregation queries


export const video=mongoose.model("Video",videoSchema)