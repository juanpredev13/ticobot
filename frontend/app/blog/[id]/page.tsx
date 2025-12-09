import { notFound } from "next/navigation"
import Link from "next/link"
import { Calendar, Clock, Tag, ArrowLeft, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getBlogPostById, BLOG_DATA } from "@/lib/data/blog"
import { SiteHeader } from "@/components/site-header"

export default async function BlogPostPage({ params }: { params: { id: string } }) {
  const { id } = params
  const post = getBlogPostById(id)

  if (!post) {
    notFound()
  }

  // Get related posts from same category
  const relatedPosts = BLOG_DATA.filter((p) => p.category === post.category && p.id !== post.id).slice(0, 3)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <SiteHeader />

      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button variant="ghost" size="sm" className="mb-6" asChild>
          <Link href="/blog">
            <ArrowLeft className="mr-2 size-4" />
            Volver al blog
          </Link>
        </Button>

        {/* Article */}
        <article className="mx-auto max-w-4xl">
          {/* Article Header */}
          <header className="mb-8">
            <Badge className="mb-4">{post.category}</Badge>
            <h1 className="mb-4 text-balance text-4xl font-bold tracking-tight">{post.title}</h1>
            <p className="mb-6 text-pretty text-lg text-muted-foreground">{post.excerpt}</p>

            <div className="flex flex-wrap items-center gap-4 border-y border-border py-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                  <span className="text-sm font-semibold">{post.author.name.charAt(0)}</span>
                </div>
                <div>
                  <div className="font-medium text-foreground">{post.author.name}</div>
                  <div className="text-xs">{post.author.role}</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <Calendar className="size-4" />
                  {new Date(post.publishedDate).toLocaleDateString("es-CR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="size-4" />
                  {post.readTime} min de lectura
                </span>
              </div>
              <Button variant="outline" size="sm" className="ml-auto bg-transparent">
                <Share2 className="mr-2 size-4" />
                Compartir
              </Button>
            </div>
          </header>

          {/* Article Content */}
          <div className="prose prose-slate max-w-none dark:prose-invert">
            <div
              className="leading-relaxed [&>h1]:mb-4 [&>h1]:mt-8 [&>h1]:text-3xl [&>h1]:font-bold [&>h2]:mb-3 [&>h2]:mt-6 [&>h2]:text-2xl [&>h2]:font-semibold [&>h3]:mb-2 [&>h3]:mt-4 [&>h3]:text-xl [&>h3]:font-semibold [&>p]:mb-4 [&>ul]:mb-4 [&>ul]:space-y-2 [&>ul]:pl-6"
              dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, "<br />") }}
            />
          </div>

          {/* Tags */}
          <div className="mt-8 border-t border-border pt-6">
            <div className="flex flex-wrap items-center gap-2">
              <Tag className="size-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Etiquetas:</span>
              {post.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </article>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <div className="mx-auto mt-16 max-w-4xl">
            <h2 className="mb-6 text-2xl font-bold">Artículos relacionados</h2>
            <div className="grid gap-6 md:grid-cols-3">
              {relatedPosts.map((relatedPost) => (
                <Card key={relatedPost.id} className="group transition-all hover:shadow-lg">
                  <CardHeader className="border-b border-border bg-muted/50">
                    <Badge variant="secondary" className="mb-2 w-fit">
                      {relatedPost.category}
                    </Badge>
                    <CardTitle className="text-base group-hover:text-primary">{relatedPost.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <p className="mb-4 line-clamp-3 text-sm text-muted-foreground">{relatedPost.excerpt}</p>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/blog/${relatedPost.id}`}>Leer más</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
