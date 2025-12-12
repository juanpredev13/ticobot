import swaggerJsdoc from 'swagger-jsdoc';
import packageJson from '../../package.json' with { type: 'json' };

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TicoBot API',
      version: packageJson.version,
      description: 'RESTful API for TicoBot - Costa Rica 2026 Government Plans Analysis Platform',
      contact: {
        name: 'TicoBot',
        url: 'https://github.com/juanpredev13/ticobot',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server',
      },
      {
        url: 'https://api.ticobot.com',
        description: 'Production server',
      },
    ],
    tags: [
      {
        name: 'Chat',
        description: 'Chat with RAG context from government plans',
      },
      {
        name: 'Search',
        description: 'Semantic search through indexed documents',
      },
      {
        name: 'Documents',
        description: 'Document management and retrieval',
      },
    ],
    components: {
      schemas: {
        ChatRequest: {
          type: 'object',
          required: ['query'],
          properties: {
            query: {
              type: 'string',
              description: 'User question or message',
              example: '¿Qué proponen los partidos sobre educación?',
            },
            conversationId: {
              type: 'string',
              description: 'Optional conversation ID for context continuity',
              example: 'conv_123abc',
            },
            options: {
              type: 'object',
              properties: {
                maxTokens: {
                  type: 'number',
                  description: 'Maximum tokens in response',
                  example: 500,
                },
                temperature: {
                  type: 'number',
                  description: 'Sampling temperature (0-1)',
                  example: 0.7,
                },
              },
            },
          },
        },
        ChatResponse: {
          type: 'object',
          properties: {
            response: {
              type: 'string',
              description: 'AI-generated response',
            },
            sources: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Source',
              },
            },
            conversationId: {
              type: 'string',
              description: 'Conversation ID for follow-up queries',
            },
          },
        },
        SearchRequest: {
          type: 'object',
          required: ['query'],
          properties: {
            query: {
              type: 'string',
              description: 'Search query text',
              example: 'propuestas sobre salud pública',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of results',
              default: 10,
              example: 5,
            },
            filters: {
              type: 'object',
              properties: {
                partyId: {
                  type: 'string',
                  description: 'Filter by political party',
                },
                section: {
                  type: 'string',
                  description: 'Filter by document section',
                },
              },
            },
          },
        },
        SearchResponse: {
          type: 'object',
          properties: {
            results: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/SearchResult',
              },
            },
            total: {
              type: 'number',
              description: 'Total number of results found',
            },
          },
        },
        SearchResult: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Chunk ID',
            },
            content: {
              type: 'string',
              description: 'Text content of the chunk',
            },
            score: {
              type: 'number',
              description: 'Similarity score (0-1)',
            },
            metadata: {
              type: 'object',
              properties: {
                documentId: {
                  type: 'string',
                },
                partyName: {
                  type: 'string',
                },
                section: {
                  type: 'string',
                },
                pageNumber: {
                  type: 'number',
                },
              },
            },
          },
        },
        Document: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Document unique identifier',
            },
            title: {
              type: 'string',
              description: 'Document title',
            },
            partyName: {
              type: 'string',
              description: 'Political party name',
            },
            partyId: {
              type: 'string',
              description: 'Political party identifier',
            },
            url: {
              type: 'string',
              description: 'Original PDF URL from TSE',
            },
            uploadDate: {
              type: 'string',
              format: 'date-time',
              description: 'Document upload timestamp',
            },
            totalPages: {
              type: 'number',
              description: 'Total number of pages',
            },
            totalChunks: {
              type: 'number',
              description: 'Total number of indexed chunks',
            },
            metadata: {
              type: 'object',
              additionalProperties: true,
            },
          },
        },
        Source: {
          type: 'object',
          properties: {
            documentId: {
              type: 'string',
            },
            chunkId: {
              type: 'string',
            },
            content: {
              type: 'string',
            },
            pageNumber: {
              type: 'number',
            },
            relevanceScore: {
              type: 'number',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
            },
            details: {
              type: 'string',
              description: 'Additional error details',
            },
          },
        },
      },
    },
  },
  apis: ['./src/api/routes/*.ts'], // Path to the API routes
};

export const swaggerSpec = swaggerJsdoc(options);
