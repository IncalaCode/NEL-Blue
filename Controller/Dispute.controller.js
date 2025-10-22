//getDispute,addDispute
const Dispute = require("../Models/Dispute.model");
const asyncHandler = require("express-async-handler");

const fs=require('fs')
const path=require('path')

const getDispute = asyncHandler(async (req, res) => {
    const disputes = await Dispute.find();
    res.status(200).json(disputes);
});
const addDispute = asyncHandler(async (req, res) => {
    const { userId, message } = req.body;
   const image = req.files
      ? req.files.map((file) => `/uploads/${file.filename}`)
      : [];
    const dispute = new Dispute({ userId, message,image });
    await dispute.save();
    res.status(201).json(dispute);
});
module.exports = { getDispute, addDispute };