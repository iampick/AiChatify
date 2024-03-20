import axios from 'axios';
import { NextResponse } from 'next/server';
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import getImageBinary from '../../../line-utils';

// Let's initialize it as null initially, and we will assign the actual database instance later.
let db = null;
const config = {
  accessToken: process.env.LINE_ACCESS_TOKEN,
  channelSecret: process.env.LINE_SECRET_TOKEN,
};

// console.log(client);
export async function GET(req, res) {
  console.log('line get');
  const data_raw = await req.json();
  return NextResponse.json({ message: 'Hello API from GET' }, { status: 200 });
}

export async function POST(req, res) {
  console.log('line POST');

  const data_raw = await req.json();
  const replyToken = data_raw.events[0].replyToken;
  const retrieveMsg = data_raw.events[0].message.text;
  const userId = data_raw.destination;
  const messageType = data_raw.events[0].message.type;
  let conversionId = '';
  console.log(data_raw.events[0].message);

  return NextResponse.json({ message: 'Hello API from POST' }, { status: 200 });
  // Chat with AI
  if (!db) {
    // If the database instance is not initialized, open the database connection
    db = await open({
      filename: './sqlite.db', // Specify the database file path
      driver: sqlite3.Database, // Specify the database driver (sqlite3 in this case)
    });
  }

  // Query to get all todos from the "todo" table
  const userInDb = await db.get(
    `SELECT * FROM UserConv where userId = ? limit 1`,
    userId,
  );

  if (userInDb) {
    conversionId = userInDb.conversionId;
  }

  let dataToAi = JSON.stringify({
    message: retrieveMsg,
    userId: userId,
    conversionId: conversionId,
  });

  let configAi = {
    method: 'post',
    maxBodyLength: Infinity,
    url: `${process.env.API_ENPOINT}/api/dify`,
    headers: {
      'Content-Type': 'application/json',
    },
    data: dataToAi,
  };

  axios
    .request(configAi)
    .then(async (response) => {
      // Assuming `response.data` is a stringified JSON that looks like the given output.
      const dataString = JSON.parse(JSON.stringify(response.data));
      const rawData = response.data;
      // console.log(response.data);
      const dataParts = rawData
        .split('\n')
        .filter((part) => part.startsWith('data:'));

      // Define an object to hold the extracted information.
      let extractedData = {
        conversation_ids: new Set(), // Use a Set to avoid duplicate IDs
        answers: [],
      };

      dataParts.forEach((part) => {
        const jsonPart = part.substring(6); // Remove 'data: ' prefix
        try {
          const parsedObj = JSON.parse(jsonPart);

          // Add the conversation_id to the Set (duplicates will be ignored).
          extractedData.conversation_ids.add(parsedObj.conversation_id);

          // Add the answer to the answers array.
          extractedData.answers.push(parsedObj.answer);
        } catch (error) {
          console.error('Failed to parse JSON:', jsonPart, 'Error:', error);
          // Handle parse error or continue.
        }
      });

      // Convert the Set of conversation IDs to an array for easier usage.
      extractedData.conversation_ids = [...extractedData.conversation_ids];
      const converId = extractedData.conversation_ids;
      const converIdString = converId.join(); // This will use comma as the default separator
      console.log(converIdString);
      const combinedAnswer = extractedData.answers.join(' ');
      if (conversionId === '') {
        const result = await db.run(
          `INSERT INTO UserConv (userId, conversionId) VALUES (?, ?)`,
          [userId, converIdString],
        );
      }
      // console.log('Conversation IDs:', extractedData.conversation_ids);
      // console.log('Answers:', extractedData.answers.join(' ')); // Join answers or handle as needed.
      // Get a cookie value by name
      // const cookieValue = req.cookies.get('difyPickConId');
      // const Nextresponse = NextResponse.next();

      const data = {
        replyToken,
        messages: [
          {
            type: 'text',
            text: combinedAnswer,
          },
        ],
      };
      const Lineresponse = await axios.post(
        'https://api.line.me/v2/bot/message/reply',
        data,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${config.accessToken}`,
          },
        },
      );
      // console.log(JSON.stringify(Lineresponse.data));
    })
    .catch((error) => {
      console.log(error);
    });
  // Chat with AI

  // console.log(data_raw);
  // console.log(data_raw.events[0].message);

  // console.log(JSON.stringify(response.data, null, 4));

  return NextResponse.json({ message: 'Hello API from POST' }, { status: 200 });
}
