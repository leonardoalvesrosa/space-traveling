import Link from 'next/link';
import { GetStaticProps } from 'next';
import { format } from 'date-fns';
import { getPrismicClient } from '../services/prismic';
import Prismic from '@prismicio/client';
import Header from '../components/Header';
import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import { useState } from 'react';
import Head from 'next/head';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

var postsArray: Post[] = [];

export default function Home({ postsPagination }: HomeProps) {

  const { next_page, results } = postsPagination;

  const [posts, setPosts] = useState<Post[]>(results);
  const [nextPage, setNextPage] = useState<any>(next_page);

  async function fetchPosts(nextPageParam) {

    // axios({
    //   method: "get",
    //   url: nextPageParam
    // }).then(function (response) {
    //   const responsePosts = response.data.results[0];
    //   const postsData = {
    //     uid: responsePosts.uid,
    //     first_publication_date: format(
    //       new Date(responsePosts.first_publication_date), `dd MMM yyyy`
    //     ),
    //     data: {
    //       title: responsePosts.data.title,
    //       subtitle: responsePosts.data.subtitle,
    //       author: responsePosts.data.author
    //     }
    //   }

    //   setNextPage(response.data.next_page);

    //   postsArray.push(postsData);

    //   setPosts(postsArray);
    // })


    fetch(nextPageParam)
      .then(response => response.json())
      .then(resJson => {
        const responsePosts = resJson.results[0];

        // console.log(responsePosts)

        const postsData = {
          uid: responsePosts.uid,
          first_publication_date: format(
            new Date(responsePosts.first_publication_date), `dd MMM yyyy`
          ),
          data: {
            title: responsePosts.data.title,
            subtitle: responsePosts.data.subtitle,
            author: responsePosts.data.author
          }
        }

        setNextPage(resJson.next_page);

        postsArray.push(postsData);

        setPosts([
          ...posts,
          postsData
        ]);
      }

      )

  }

  return (
    <>

      <Head>
        <title>Posts | Ignews</title>
      </Head>

      <Header />

      <div className={styles.container}>

        {posts && (
          <div className={styles.container}>
            {posts.map(post => (
              <div className={styles.posts} key={post.uid}>
                <Link href={`/post/${post.uid}`}>
                  <a key={post.uid}>
                    <h2>{post.data.title}</h2>
                    <p>{post.data.subtitle}</p>
                    <div>
                      <time><img src="/images/calendar.png"></img>{format(new Date(post.first_publication_date), `dd MMM yyyy`)}</time>
                      <span><img src="/images/user.png"></img>{post.data.author}</span>
                    </div>
                  </a>
                </Link>
              </div>
            ))}
          </div>

        )}


        {nextPage && (
          <>
            <button onClick={() => fetchPosts(nextPage)}>
              Carregar mais posts
            </button>
          </>
        )}


      </div>
    </>
  )
}

export const getStaticProps: GetStaticProps = async () => {

  const prismic = getPrismicClient();

  const postsResponse = await prismic.query([
    Prismic.predicates.at('document.type', 'post')
  ], {
    fetch: [
      'post.title',
      'post.subtitle',
      'post.author',
      'post.content'
    ],
    pageSize: 2,
  });

  // console.log(JSON.stringify(postsResponse, null, 2));

  const next_page = postsResponse.next_page;

  const results = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      // first_publication_date: format(
      //   new Date(post.first_publication_date), `dd MMM yyyy`
      // ),
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author
      }
    }
  })

  const postsPagination = {
    next_page,
    results
  }

  return {
    props: {
      postsPagination
    }
  }
};
