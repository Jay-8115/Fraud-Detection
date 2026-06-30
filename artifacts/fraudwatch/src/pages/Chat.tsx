import { useState, useRef, useEffect } from "react"
import { AppLayout } from "@/components/layout/AppLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Send, Bot, User, Sparkles } from "lucide-react"
import { useGetChatHistory, useSendChatMessage, useListAnalyses } from "@workspace/api-client-react"

export function ChatPage() {
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string | undefined>()
  const [input, setInput] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)

  const { data: analyses } = useListAnalyses({ limit: 5 })
  const { data: history, isLoading } = useGetChatHistory(selectedAnalysisId || 'default', {
    query: { enabled: true }
  })
  
  const sendMessage = useSendChatMessage()

  // Use a local state to append optimistic messages instantly
  const [localMessages, setLocalMessages] = useState<any[]>([])

  useEffect(() => {
    if (history?.data) {
      setLocalMessages(history.data)
    }
  }, [history?.data])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [localMessages])

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!input.trim()) return

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      createdAt: new Date().toISOString()
    }
    
    setLocalMessages(prev => [...prev, userMessage])
    setInput("")

    sendMessage.mutate({
      data: {
        message: userMessage.content,
        analysisId: selectedAnalysisId
      }
    }, {
      onSuccess: (responseMessage) => {
        setLocalMessages(prev => [...prev, responseMessage])
      }
    })
  }

  const suggestedPrompts = [
    "Summarize my latest analysis",
    "Explain the Isolation Forest model",
    "What are common indicators of wire fraud?",
    "How can I reduce false positives?"
  ]

  return (
    <AppLayout title="AI Assistant">
      <div className="flex h-[calc(100vh-8rem)] flex-col gap-4">
        {analyses && analyses.data.length > 0 && (
          <div className="flex items-center gap-2 bg-white p-3 rounded-lg border shadow-sm">
            <span className="text-sm font-medium text-slate-700">Context:</span>
            <select 
              className="flex-1 bg-transparent text-sm outline-none cursor-pointer"
              value={selectedAnalysisId || ""}
              onChange={(e) => setSelectedAnalysisId(e.target.value || undefined)}
            >
              <option value="">General Assistant (No specific analysis)</option>
              {analyses.data.map(a => (
                <option key={a.id} value={a.id}>Analysis: {a.fileName}</option>
              ))}
            </select>
          </div>
        )}

        <Card className="flex-1 flex flex-col overflow-hidden shadow-md border-primary/10">
          <CardContent className="flex-1 overflow-auto p-6 space-y-6" ref={scrollRef}>
            {localMessages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center space-y-6">
                <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Bot className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">FraudWatch AI</h3>
                  <p className="text-muted-foreground mt-2 max-w-sm">
                    Ask questions about your data, get explanations for risk scores, or learn about fraud prevention techniques.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 w-full max-w-lg mt-8">
                  {suggestedPrompts.map((prompt, i) => (
                    <button 
                      key={i}
                      onClick={() => setInput(prompt)}
                      className="text-sm text-left p-3 border rounded-lg hover:border-primary hover:bg-primary/5 transition-colors"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              localMessages.map((msg) => (
                <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                    msg.role === 'user' ? 'bg-slate-200' : 'bg-primary/10 text-primary'
                  }`}>
                    {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>
                  <div className={`px-4 py-3 rounded-2xl max-w-[80%] ${
                    msg.role === 'user' 
                      ? 'bg-slate-900 text-white rounded-tr-sm' 
                      : 'bg-white border shadow-sm rounded-tl-sm text-slate-800'
                  }`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))
            )}
            {sendMessage.isPending && (
              <div className="flex gap-4">
                <div className="shrink-0 h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <Sparkles className="h-4 w-4 animate-pulse" />
                </div>
                <div className="px-4 py-3 rounded-2xl bg-white border shadow-sm rounded-tl-sm flex items-center gap-1">
                  <span className="h-2 w-2 bg-slate-300 rounded-full animate-bounce"></span>
                  <span className="h-2 w-2 bg-slate-300 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
                  <span className="h-2 w-2 bg-slate-300 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></span>
                </div>
              </div>
            )}
          </CardContent>
          <div className="p-4 bg-slate-50 border-t">
            <form onSubmit={handleSend} className="flex gap-2">
              <Input 
                placeholder="Ask about fraud detection..." 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 bg-white h-12 rounded-full px-6 shadow-sm border-slate-200 focus-visible:ring-primary focus-visible:border-primary"
                disabled={sendMessage.isPending}
              />
              <Button type="submit" size="icon" className="h-12 w-12 rounded-full shrink-0 shadow-sm" disabled={!input.trim() || sendMessage.isPending}>
                <Send className="h-5 w-5" />
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </AppLayout>
  )
}
