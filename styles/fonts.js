import { Poppins, reset } from 'next/font/google';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '700'],
});

export default reset(); // Export the reset function
