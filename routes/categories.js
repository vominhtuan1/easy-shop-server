const {Category} = require('../models/category');
const express = require('express');
const { route } = require('./products');
const router = express.Router();
const multer = require('multer');

const FILE_TYPE_MAP = {
    'image/png': 'png',
    'image/jpeg': 'jpeg',
    'image/jpg': 'jpg',
};

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const isValid = FILE_TYPE_MAP[file.mimetype];
        let uploadError = new Error('invalid image type');

        if (isValid) {
            uploadError = null;
        }
        cb(uploadError, 'public/uploads');
    },
    filename: function (req, file, cb) {
        const fileName = file.originalname.split(' ').join('-');
        const extension = FILE_TYPE_MAP[file.mimetype];
        cb(null, `${fileName}-${Date.now()}.${extension}`);
    },
});

const uploadOptions = multer({ storage: storage });


router.get(`/`, async (req, res) =>{
    const categoryList = await Category.find();

    if(!categoryList) {
        res.status(500).json({success: false})
    } 
    res.send(categoryList);
})

router.put(`/:id`,uploadOptions.single('icon'),async (req, res) => {

    const category = await Category.findById(req.params.id);
    if (!category) return res.status(400).send('Invalid Category!');

    const file = req.file;
    let iconpath;

    if (file) {
        const fileName = file.filename;
        const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;
        iconpath = `${basePath}${fileName}`;
    } else {
        iconpath = category.icon;
    }


    const updateCategory = await Category.findByIdAndUpdate(
        req.params.id,
        {
            name: req.body.name,
            icon: iconpath
        },{
            new: true
        }
    )

    if(!updateCategory) {
        return res.status(400).send('the category cannot be updated')
    } 
    res.send(updateCategory);
})

router.get('/:id', async(req,res)=>{
    const category = await Category.findById(req.params.id);

    if(!category) {
        res.status(500).json({message: 'The category with the given ID was not found.'})
    } 
    res.status(200).send(category);
})

router.post(`/`,uploadOptions.single('icon'), async (req, res) =>{
    const file = req.file;
    if (!file) return res.status(400).send('No image in the request');

    const fileName = file.filename;
    const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;

    let category = new Category({
        name: req.body.name,
        icon: `${basePath}${fileName}`
    })

    category = await category.save();

    if(!category)
    return res.status(404).send('the category cannot be created!')

    res.send(category);
})

router.delete('/:id', (req,res) =>{
    Category.findByIdAndRemove(req.params.id).then(category =>{
        if(category){
            return res.status(200).json({success: true, messege: 'the category is deleted!'})
        } else {
            return res.status(404).json({success: false, messege: 'category not found!'})
        }
    }).catch(err=>{
        return res.status(400).json({success: false, error: err})
    })
})
module.exports =router;