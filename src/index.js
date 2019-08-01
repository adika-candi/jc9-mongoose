var express = require('express')
const mongoose = require('mongoose')
const multer = require('multer')
const brypt=require("bcrypt")
const sharp = require('sharp')
const cors=require("cors")

const User = require('./models/users.js')
const Task = require('./models/tasks.js')
 
mongoose.connect('mongodb+srv://adika:193752468@jc9-cluster-gjphn.mongodb.net/jc9-cluster?retryWrites=true&w=majority', {
    // Parser string URL
    useNewUrlParser: true,

    // ensureIndex(), usang
    // createIndex(), baru
    useCreateIndex: true
})

const app = express()
const port = 2019

app.use(cors())

app.use(express.json())

app.get('/', (req, res) => {
    res.send("<h1>API Berhasil di jalankan</h1>")
})



// CREAT ONE USER
app.post('/users/input', async (req, res) => {
    const {name, email, age, password} = req.body

    const data_name = name
    const data_email = email
    const data_password = password
    const data_age = age

    // Create new object user
    const person = new User({
        name: data_name,
        email: data_email,
        password: data_password,
        age: data_age
    })

    // ES7
    try {
        var result = await person.save()
        res.send(result)
    } catch (err) {
        res.send(err.message)
    }

    // ES6
    // person.save()
    // .then(result => {
    //     res.send(result)
    // }).catch(err => {
    //     res.send(err.message)
    // })
    

})

// Konfigurasi multer a.k.a upload gambar
const upload = multer({
    limits: {
        fileSize: 1000000 // Byte
    },
    fileFilter(req, file, cb){
        var boleh = file.originalname.match(/\.(jpg|jpeg|png)$/)

        if(!boleh){ // jika tidak match
            cb(new Error('Please upload file dengan ext .jpg.png.jpeg'))
        }

        // file di terima
        cb(undefined, true)
    }
})

// CREATE AVATAR
app.post('/users/:id/avatar', upload.single('ravatar'),(req, res) => {
    const data_id = req.params.id
    
    // Resize ukuran dan ubah ext png
    sharp(req.file.buffer).resize({width: 250}).png().toBuffer()
    .then(buffer => {
        // hasil resize ada di buffer
        // cari user berdasarkan id
        User.findById(data_id)
        .then(user => {

            // simpan buffer tadi di property avatar milik user
            user.avatar = buffer

            // simpan user
            user.save()
            .then(() => {
                res.send('Upload berhasil')
            })
        })
    })
})


// READ ALL USERS
app.get('/users', (req, res) => {

    User.find()
        .then(result => {
            // result: array of object
            res.send(result)
        })
})

// READ ONE USER BY ID
app.get('/users/:id', (req, res) => {
    const data_id = req.params.id

    // Search  by id
    User.findById(data_id)
        .then(user => {
            // user : {_id, name, password, email, age}

            // jika user tidak ditemukan
            if(!user){
                return res.send(`User dengan id ${data_id} tidak ditemukan`)
            }

            // jika user ditemukan
            res.send(user)
            
        }) 
})

// UPDATE NAME BY ID
app.patch('/users/:id', upload.single('ravatar') ,(req, res) => {
    let arrayBody = Object.keys(req.body)
    // req.body {name, email, age, password}
    // arrayBody [name, email, age, password]
    arrayBody.forEach(key => {
        if(!req.body[key]){
            delete req.body[key]
        }
    })
    // req.body {name, email, age}
    // arrayBody [name, email, age]
    arrayBody = Object.keys(req.body)

    const data_id = req.params.id
    
    User.findById(data_id)
        .then(user => {
            // user : {_id, name, password, email, age}

            if(!user){
                return res.send("User tidak di temukan")
            }

            // update user
            // arrayBody [name, email, age]
            arrayBody.forEach(key => {
                user[key] = req.body[key]
            })

            sharp(req.file.buffer).resize({width: 250}).png().toBuffer()
            .then(buffer => {

                user.avatar = buffer

                user.save()
                    .then(() => {
                        res.send('Update Profile Berhasil')
                    })

            })
            

            
        })
})

// DELETE USER BY ID
app.delete('/users/:id', (req, res) => {
    const data_id = req.params.id

    User.findByIdAndDelete(data_id)
        .then(user => {
            
            if(!user){
                return res.send("User tidak di temukan")
            }

            res.send({
                data: user,
                message: "User berhasil di hapus"
            })

        })
})



// CREATE ONE TASK
app.post('/tasks/:userid', (req, res) => {
    const data_desc = req.body.description
    const data_id=req.params.userid

    User.findById(data_id)
        .then(user=>{
            if(!user){
                res.send("unable to create task")
            }

            const task= new Task({
                description:data_desc,
                owner:data_id
            })

            user.tasks=user.tasks.concat(task._id)

            user.save()
                .then(()=>{
                    task.save()
                        .then(()=>{
                            res.send(task)
                        })
                })
        })

})

// READ TASK BY USER ID
app.get('/tasks/:userid', (req, res) => {

    // Mencari user berdasarkan Id
    User.findById(req.params.userid)
        .populate(
            {
                path: 'tasks',
                options: {
                // sorting data secara descending berdasarkan field completed
                    sort: {
                        completed: 1
                    }
                }
            }
        ).exec() // Mencari data ke tasks berdasarkan task id untuk kemudian di kirim sebagai respon
            .then(user => {
            // Jika user tidak ditemukan
            if(!user){
                res.send('Unable to read tasks')
            }

            // Kirim respon hanya untuk field (kolom) tasks
            res.send(user.tasks)

        })
})

// UPDATE TASK BY USERID AND TASKID
app.patch('/tasks/:userid/:taskid', (req, res) => {
    const data_userid = req.params.userid
    const data_taskid = req.params.taskid
    // Menemukan user by id
    User.findById(data_userid)
        .then(user => {
            if(!user) {
                return res.send('User tidak ditemukan')
            }

            // Menemukan task by id
            Task.findOne({_id: data_taskid})
                .then(task => {
                    if(!task) {
                        return res.send('Task tidak ditemukan')
                    }

                    // Ubah nilai false menjadi true dan kebalikannya
                    task.completed = !task.completed

                    task.save()
                        .then(()=>{
                            res.send('Selesai dikerjakan')
                        })
                })
        })

})


// DELETE TASK BY ID
app.delete('/tasks', (req, res) => {
    const data_taskid = req.body.taskid

    Task.findByIdAndDelete({_id: data_taskid})
        .then(result => {
            res.send(result) 
        })
})

//LOGIN USER
// LOGIN USER
app.post('/users/login', async (req, res) => {
    const data_email = req.body.email
    const data_pass = req.body.password


    try {
        const hasil = await User.loginWithEmail(data_email, data_pass)
        res.send(hasil)
    } catch (error) { // Berasal dari throw di function loginWithEmail
        res.send(error.message)
    }


})

//READ AVATAR
app.get('/users/:id/avatar', async (req, res) => {
    // get user, kirim foto
    const user = await User.findById(req.params.id)

    if(!user || !user.avatar){
        throw new Error('Foto / User tidak ada')
    }

    res.set('Content-Type', 'image/png')
    res.send(user.avatar) // default: ContentType : application/json

})








app.listen(port, () => {
    console.log('Berjalan di port ' + port)
})