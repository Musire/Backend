const jwt = require('jsonwebtoken');
const axios = require('axios')

const generateAuthToken = (role, roomId="", participantId="") => {
    try {
        const API_KEY = process.env.VIDEO_SDK_API_KEY;
        const SECRET = process.env.VIDEO_SDK_API_SECRET;
        
        const options = { 
        expiresIn: '120m', 
        algorithm: 'HS256' 
        };

        const permissions = {
          creator: 'allow_mod',
          caller: 'allow_join',
          interpreter: 'allow_join',
        }

        const payload = {
          apikey: API_KEY,
          permissions: [permissions[role]],
          version: 2,
          roomId, 
          participantId,
          roles: [role], 
        };
        
        const token = jwt.sign(payload, SECRET, options);
        return token
    } catch (error) {
        console.error('Error creating auth token:', error);
        throw new Error('Failed to create auth token');
    }
}

const generateRoom = async (authToken) => {
    try {
      const response = await axios.post(
        'https://api.videosdk.live/v2/rooms',
        {},
        {
          headers: {
            Authorization: authToken, // Attach the auth token in headers
          },
        }
      );
  
      const { roomId } = response.data;
      return roomId
    } catch (error) {
      console.error('Error creating meeting:', error);
      throw new Error('Failed to create meeting');
    }
};

module.exports = {
    generateAuthToken, generateRoom
};