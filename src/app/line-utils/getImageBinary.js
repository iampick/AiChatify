const axios = require('axios');

async function getImageBinary(messageId, LINE_HEADER) {
  const originalImage = await axios({
    method: 'get',
    headers: LINE_HEADER,
    url: `https://api-data.line.me/v2/bot/message/${messageId}/content`,
    responseType: 'arraybuffer',
  });
  return originalImage.data;
}

export default getImageBinary();
