import { Injectable } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { Post } from './post.entity';
import { Script } from '@elastic/elasticsearch/lib/api/types';
import PostCountResult from './types/postCountBody.interface';
import PostSearchResult from './types/postSearchResponse.interface';

interface PostSearchBody {
  id: number;
  title: string;
  paragraphs: string[];
  authorId: number;
}

@Injectable()
export class PostsSearchService {
  index = 'posts';

  constructor(private readonly elasticsearchService: ElasticsearchService) {}

  // async search(text: string) {
  //   const body = await this.elasticsearchService.search<PostSearchBody>({
  //     index: this.index,
  //     body: {
  //       query: {
  //         query_string: {
  //           query: `*${text}*`,
  //           fields: ['title', 'paragraphs'],
  //         },
  //       },
  //     },
  //   });
  //   const hits = body.hits.hits.map((item) => item._source);

  //   return hits;
  // }

  async count(query: string, fields: string[]) {
    const body = await this.elasticsearchService.count({
      index: this.index,
      body: {
        query: {
          multi_match: {
            query,
            fields,
          },
        },
      },
    });
    return body.count;
  }

  async search(text: string, offset?: number, limit?: number, startId = 0) {
    let separateCount = 0;
    if (startId) {
      separateCount = await this.count(text, ['title', 'paragraphs']);
    }

    const body = await this.elasticsearchService.search({
      index: this.index,
      from: offset,
      size: limit,
      body: {
        query: {
          bool: {
            must: {
              query_string: {
                query: `*${text}*`,
                fields: ['title', 'paragraphs'],
              },
            },
            filter: {
              range: {
                id: {
                  gt: startId,
                },
              },
            },
          },
        },
        sort: {
          id: {
            order: 'asc',
          },
        },
      },
    });

    const count = (body.hits.total as { value: number }).value;
    const hits = body.hits.hits;
    const results = hits.map((item) => item._source);

    return {
      count: startId ? separateCount : count,
      results,
    };
  }

  async indexPost(post: Post) {
    return this.elasticsearchService.index<PostSearchBody>({
      index: this.index,
      body: {
        id: post.id,
        title: post.title,
        paragraphs: post.paragraphs,
        authorId: post.author.id,
      },
    });
  }

  async remove(postId: number) {
    this.elasticsearchService.deleteByQuery({
      index: this.index,
      body: {
        query: {
          match: {
            id: postId,
          },
        },
      },
    });
  }

  async update(post: Post) {
    const newBody: PostSearchBody = {
      id: post.id,
      title: post.title,
      paragraphs: post.paragraphs,
      authorId: post.author.id,
    };

    const script: Script = Object.entries(newBody).reduce(
      (result, [key, value]) => {
        return `${result} ctx._source.${key}='${value}';`;
      },
      '',
    );

    return this.elasticsearchService.updateByQuery({
      index: this.index,
      body: {
        query: {
          match: {
            id: post.id,
          },
        },
        script,
      },
    });
  }
}
