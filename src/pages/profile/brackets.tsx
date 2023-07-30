import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Image from 'next/image';
import MainLayout from '../../common/layouts/app';

import { useSession, signIn, signOut, getSession } from 'next-auth/react';

// Custom Components
import UserBrackets from '../../modules/brackets/user';

// MUI Contexts

// MUI

// Mui Colors

// Icons

// Types
import type { NextPageWithLayout } from '../_app';

const Page: NextPageWithLayout = () => {
  const { data: session, status, update } = useSession();

  return (
    <>
      <Head>
        {/* Basic metadata */}
        <title>
          {session?.user?.display_name || session?.user?.name
            ? session?.user?.display_name + ' | MakeABracket.com' ??
              session?.user?.name + ' | MakeABracket.com'
            : 'MakeABracket.com'}
        </title>
        <meta
          name="description"
          content="View or edit your MakeABracket.com brackets."
        />
        <meta name="author" content="MakeABracket.com" />
        <link rel="icon" href="/favicon.ico" />
        {/* Open Graph */}
        <meta
          property="og:title"
          content={
            session?.user?.display_name || session?.user?.name
              ? session?.user?.display_name + ' | MakeABracket.com' ??
                session?.user?.name + ' | MakeABracket.com'
              : 'MakeABracket.com'
          }
        />
        <meta
          property="og:description"
          content="View or edit your MakeABracket.com brackets."
        />
        <meta
          property="og:image"
          content={
            process.env.NEXT_PUBLIC_SITE_URL + '/Make_A_Bracket_Icon_BonT.png'
          }
        />
        <meta property="og:url" content={process.env.NEXT_PUBLIC_SITE_URL} />
        <meta property="og:type" content="website" />
        {/* Twitter Card */}
        <meta
          name="twitter:title"
          content={
            session?.user?.display_name || session?.user?.name
              ? session?.user?.display_name + ' | MakeABracket.com' ??
                session?.user?.name + ' | MakeABracket.com'
              : 'MakeABracket.com'
          }
        />
        <meta
          name="twitter:description"
          content="View or edit your MakeABracket.com brackets."
        />
        <meta
          name="twitter:image"
          content={
            process.env.NEXT_PUBLIC_SITE_URL + '/Make_A_Bracket_Icon_BonT.png'
          }
        />
        <meta
          name="twitter:card"
          content="User brackets on MakeABracket.com."
        />
      </Head>

      <UserBrackets />

      <footer></footer>
    </>
  );
};

Page.getLayout = function getLayout(page: React.ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};

export default Page;
