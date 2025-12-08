import { useState, useEffect } from 'react';
import axios from 'axios';
import { Geist } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

interface Message {
  id: number;
  text: string;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    axios.get('http://localhost:8000/api/messages/')
      .then(response => {
        setMessages(response.data);
      })
      .catch(error => {
        console.error('There was an error fetching the messages!', error);
      });
  }, []);

  return (
    <div
      className={`${geistSans.className} flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black`}
    >
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-start py-32 px-16 bg-white dark:bg-black sm:items-start">
        <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50 mb-8">
          Messages from Django
        </h1>
        <ul className="list-disc list-inside">
          {messages.map(message => (
            <li key={message.id} className="text-lg leading-8 text-zinc-600 dark:text-zinc-400">
              {message.text}
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
