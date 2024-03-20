// pages/api/chatMessages.js
import axios from 'axios';

export async function POST(req) {
  const api_key = process.env.DIFY_API_KEY; // Ensure you have your API key stored in .env.local
  const data_raw = await req.json();
  console.log(data_raw);
  // Set up the headers
  const headers = {
    Authorization: `Bearer ${api_key}`,
    'Content-Type': 'application/json',
  };

  let converId = data_raw.conversionId !== '' ? data_raw.conversionId : '';
  // Hard-coded data
  const data = {
    inputs: {},
    query: data_raw.message,
    response_mode: 'streaming',
    conversation_id: converId,
    user: data_raw.userId,
  };

  try {
    const response = await axios.post(
      'https://api.dify.ai/v1/chat-messages',
      data,
      { headers },
    );

    // Return the data from the API call
    return new Response(response.data, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error(error);
    let status = 500;
    let message = 'An error occurred while processing your request.';

    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      status = error.response.status;
      message = error.message;
    } else if (error.request) {
      // The request was made but no response was received
      message = 'No response was received from the API.';
    }

    return new Response(JSON.stringify({ message }), {
      status: status,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
