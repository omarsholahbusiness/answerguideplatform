import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

const handleAuth = async () => {
    const userId = "fakeId"; // Replace with actual auth
    if (!userId) throw new Error("Unauthorized");
    return { userId };
};

export const ourFileRouter = {
    courseImage: f({ image: { maxFileSize: "100GB", maxFileCount: 1 } })
        .middleware(() => handleAuth())
        .onUploadComplete(() => {}),
    courseAttachment: f({ 
        text: {maxFileSize: "100GB"},
        image: {maxFileSize: "100GB"},
        video: {maxFileSize: "100GB"},
        audio: {maxFileSize: "100GB"},
        pdf: {maxFileSize: "100GB"}
    })
        .middleware(() => handleAuth())
        .onUploadComplete(() => {}),
    chapterVideo: f({ video: { maxFileSize: "100GB", maxFileCount: 1 } })
        .middleware(() => handleAuth())
        .onUploadComplete(() => {})
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter; 