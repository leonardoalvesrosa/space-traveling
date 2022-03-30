import { GetStaticPaths, GetStaticProps } from 'next';
import Prismic from '@prismicio/client';
import { getPrismicClient } from '../../services/prismic';
import { RichText } from "prismic-dom";
import Head from 'next/head';
import Header from '../../components/Header';
import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { format } from 'date-fns';
import router, { useRouter } from 'next/router';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {

  const router = useRouter();

  const bodySize = [];
  let contentsBody = [];

  const contentPosts = post.data.content;

  contentPosts.map(bodyArray => {
    contentsBody.push(bodyArray.body);
  })

  for (let i = 0; i < contentsBody.length; i++) {
    bodySize.push(RichText.asText(contentsBody[i]).split(' ').length);
  }
  const sumZise = bodySize.reduce((acc, num) => acc + num);
  const timeReading = Math.ceil(sumZise / 200);

  if (router.isFallback) {
    return <div>Carregando...</div>
  }

  return (
    <>

      <Header />

      <div className={styles.banner}>
        <img src={post.data.banner.url} alt="banner" />
      </div>

      <main className={styles.container} key={post.first_publication_date}>
        <h2>{post.data.title}</h2>
        <div className={styles.info}>
          <time><img src="/images/calendar.png"></img>{(format(new Date(post.first_publication_date), `dd MMM yyyy`)).toLowerCase()}</time>
          <span><img src="/images/user.png"></img>{post.data.author}</span>
          <span><img src="/images/clock.png"></img>{timeReading} min</span>
        </div>


        {post.data.content.map(content => (
          <div className={styles.content}>
            <h3>{content.heading}</h3>
            {content.body.map(body => (
              <p>{body.text}</p>
            ))}
          </div>
        ))}


      </main>

    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {

  const prismic = getPrismicClient();

  const posts = await prismic.query([
    Prismic.predicates.at('document.type', 'post')
  ], {
    fetch: ['post.title', 'post.subtitle', 'post.author', 'post.content'],
  });

  const paths = posts.results.map(post => ({
    params: { slug: post.uid }
  }));

  return {
    paths,
    fallback: true
  }
};

export const getStaticProps: GetStaticProps = async ({ params }) => {

  const { slug } = params;

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('post', String(slug), {});

  const post = {
    first_publication_date: response.first_publication_date,
    uid: response.uid,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url
      },
      author: response.data.author,
      content: response.data.content,
    }

  }

  return {
    props: {
      post
    },
    redirect: 60 * 30 // 30 minutes
  }
};


