const Jimp = require("jimp");

export default async function handler(req, res) {

    if(req.method !== "POST"){
        return res.status(405).json({
            error:"Method not allowed"
        });
    }


    try{

        const {
            name,
            number,
            photo
        } = req.body;



        const template =
        await Jimp.read(
            process.cwd() +
            "/public/Poster-template.png"
        );



        const imageBuffer =
        Buffer.from(
            photo.split(",")[1],
            "base64"
        );



        const userImage =
        await Jimp.read(imageBuffer);



        userImage.cover(
            245,
            342
        );



        template.composite(
            userImage,
            78,
            580
        );



        const font =
        await Jimp.loadFont(
            Jimp.FONT_SANS_32_BLACK
        );



        template.print(
            font,
            112,
            1006,
            name || "Your Name"
        );



        template.print(
            font,
            112,
            1080,
            number || "Mobile Number"
        );



        const buffer =
        await template.getBufferAsync(
            Jimp.MIME_PNG
        );



        res.setHeader(
            "Content-Type",
            "image/png"
        );


        res.send(buffer);



    }catch(error){


        console.log(error);


        res.status(500).json({

            error:error.message

        });


    }

}
