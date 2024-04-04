import axios from 'axios';
import { NextResponse } from 'next/server';
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
const path = require('path');

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// import { getImageBinary } from '../../line-utils/getImageBinary';

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
  // console.log(data_raw.events[0].message);

  // Query to get all todos from the "todo" table
  const userInDb = await prisma.UserConv.findFirst({
    where: {
      userId: userId,
    },
  });

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
          console.log(parsedObj.answer);

          // Add the conversation_id to the Set (duplicates will be ignored)
          extractedData.conversation_ids.add(parsedObj.conversation_id);

          // Add the answer to the answers array, handling potential undefined values
          if (parsedObj.answer?.length > 3)
            extractedData.answers.push(parsedObj.answer || ''); // Use empty string if undefined
        } catch (error) {
          console.error('Failed to parse JSON:', jsonPart, 'Error:', error);
          // Handle parse error or continue (e.g., log the error and continue)
        }
      });
      // console.log(extractedData.answers);
      // Convert the Set of conversation IDs to an array for easier usage.
      extractedData.conversation_ids = [...extractedData.conversation_ids];
      // console.log('-----extractedData');

      // console.log(uniqueAnswers);
      const converId = extractedData.conversation_ids;
      const converIdString = converId.join(); // This will use comma as the default separator

      // Combine unique answers into a single string
      const combinedAnswer = extractedData.answers[0]; // Join with spaces
      // const combinedAnswer = extractedData.answers.join(''); // Join with spaces
      console.log(combinedAnswer);
      if (conversionId === '') {
        const result = await prisma.userConv.create({
          data: {
            userId: userId,
            conversionId: converIdString,
          },
        });
      }

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

  return NextResponse.json({ message: 'Hello API from POST' }, { status: 200 });
}
