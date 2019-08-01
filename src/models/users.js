const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcrypt')

const userSchema = new mongoose.Schema({
    name: {
        type: String, 
        required: true, // wajib di isi
        trim: true // menghapus whitespace di awal dan di akhir data
    },
    email: {
        type: String,
        required: true,
        index: {
            unique: true 
        },
        trim: true,
        lowercase: true,
        validate(value){ // value: data yang di input user
            var hasil = validator.isEmail(value)
            
            if(!hasil){
                throw new Error('Yang anda masukkan bukan email')
            }
        }
        
    },
    password: {
        type: String,
        required:true,
        trim: true,
        minlength: 7,
        validate(value){
            if(value.toLowerCase().includes("password")){
                throw new Error("Password tidak boleh mengandung kata 'password'")
            }
        }
    },
    age: {
        // Tidak boleh string kosong, dan harus positive number
        type: Number,
        default: 0,  // default value jika user tidak input data age
        validate(value){
            if(value === null){
                throw new Error("Age tidak boleh berupa string kosong")
            } else if (value < 0){
                throw new Error("Age tidak boleh berupa angka negatif")
            }
        }
    },
    avatar: {
        type: Buffer
    },
    tasks: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task'
    }]
})

// Model Method
userSchema.statics.loginWithEmail = async (da_email, da_password) => {

    const user = await User.findOne({email: da_email})

    if(!user){ // user tidak di temukan
        throw new Error('User not found')
    }

    // da_password: satuduatiga
    // user.password: $2b$08$efjBzkL
    // match: true or false
    const match = await bcrypt.compare(da_password, user.password)

    if(!match){
        throw new Error('Wrong password')
    }

    return  user
}


// Membuat function yang akan dijalankan sebelum proses user.save()
userSchema.pre('save', async function(next){
    const user = this

    if(user.isModified('password')){ // true saat pertama dibuat dan mengalami perubahan
        var hasil = await bcrypt.hash(user.password, 8)
        user.password = hasil // karakter hasil hash
    }

    next() // lanjut ke proses save()

})

const User = mongoose.model('User', userSchema)

module.exports = User