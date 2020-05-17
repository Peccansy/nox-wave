interface Post {
  id: string;
  title: string;
  creationDate: string;
  tag?: string;
  contentImageURL?: string;
  preambule: string;
  content: string;
}

interface Predicate {
  (data: Partial<Post>): boolean;
}

const snippetScheme = {
  id: true,
  title: true,
  creationDate: true,
  preambule: true,
  tag: true
}
const snippetKeys = Object.keys(snippetScheme);
type Snippet = Pick<Post, keyof typeof snippetScheme>;

export interface DataProvider {
  select<K extends string>(...keys: K[]): DataProvider;
  whereIndex(index: string): DataProvider;
  where(fn: Predicate): DataProvider;
  limit(num: number): DataProvider;
  apply(): Promise<unknown>;
}

export interface PostProvider {
  getRecentSnippets(days: number): Promise<Snippet[]>;
  getAllSnippets(): Promise<Snippet[]>;
  getSnippetsByTag(tag: string): Promise<Snippet[]>;
  getPostById(id: string): Promise<Post>;
}

export interface PostProviderParams {
  dataProvider: DataProvider;
}

export function makePostProvider({ dataProvider }: PostProviderParams): PostProvider {
  const getPostById: PostProvider['getPostById'] = async (id) => {
    const data = await dataProvider
      .select('*')
      .whereIndex(id)
      .apply();

    return data as Post;
  }

  const getRecentSnippets: PostProvider['getRecentSnippets'] = async (days: number) => {
    const currentDate = new Date();
    currentDate.setDate(currentDate.getDate() - days);

    const posts = await dataProvider
      .select(...snippetKeys)
      .where(post => {
        const postDate = new Date(post.creationDate);
        return postDate.getTime() >= currentDate.getTime();
      })
      .apply() as Snippet[];

      return posts;
  }

  const getSnippetsByTag: PostProvider['getSnippetsByTag'] = async (tag) => {
    const posts = await dataProvider
      .select(...snippetKeys)
      .where(post => post.tag === tag)
      .apply() as Snippet[];

    return posts;
  };

  const getAllSnippets: PostProvider['getAllSnippets'] = async () => {
    return await dataProvider.select(...snippetKeys).apply() as Snippet[];
  }

  return {
    getPostById,
    getRecentSnippets,
    getSnippetsByTag,
    getAllSnippets,
  };
}
