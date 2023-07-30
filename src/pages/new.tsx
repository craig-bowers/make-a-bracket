import { useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import MainLayout from '../common/layouts/app';
import BracketEditor from '../modules/editor';

import { useSession, signIn, signOut } from 'next-auth/react';

// Types
import type { NextPageWithLayout } from './_app';

const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        {/* Basic metadata */}
        <title>New | MakeABracket.com</title>
        <meta
          name="description"
          content="Build and publish your bracket in minutes."
        />
        <meta name="author" content="MakeABracket.com" />
        <link rel="icon" href="/favicon.ico" />
        {/* Open Graph */}
        <meta property="og:title" content="New | MakeABracket.com" />
        <meta
          property="og:description"
          content="Build and publish your bracket in minutes."
        />
        <meta
          property="og:image"
          content={
            process.env.NEXT_PUBLIC_SITE_URL + '/Make_A_Bracket_Icon_BonT.png'
          }
        />
        <meta
          property="og:url"
          content={process.env.NEXT_PUBLIC_SITE_URL + '/new'}
        />
        <meta property="og:type" content="website" />
        {/* Twitter Card */}
        <meta name="twitter:title" content="New | MakeABracket.com" />
        <meta
          name="twitter:description"
          content="Build and publish your bracket in minutes."
        />
        <meta
          name="twitter:image"
          content={
            process.env.NEXT_PUBLIC_SITE_URL + '/Make_A_Bracket_Icon_BonT.png'
          }
        />
        <meta
          name="twitter:card"
          content="Create a new bracket on MakeABracket.com."
        />
      </Head>

      <main style={{ height: '100%' }}>
        <BracketEditor />
      </main>

      <footer></footer>
    </>
  );
};

Page.getLayout = function getLayout(page: React.ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

export default Page;
