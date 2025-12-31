import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: "deg2ogbod",
  api_key: "264364913816621",
  api_secret: "9PcbtgKXCS88bCCxrEzzrwt37R0",
});

(async () => {
  try {
    await cloudinary.api.delete_resources_by_prefix('photo-organizer/photos/');
    await cloudinary.api.delete_resources_by_prefix('photo-organizer/trash/');
    console.log('Deleted all photos and trash from Cloudinary');
  } catch (e) {
    console.error(e);
  }
})();