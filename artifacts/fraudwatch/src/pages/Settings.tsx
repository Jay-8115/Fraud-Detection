import { useState } from "react"
import { AppLayout } from "@/components/layout/AppLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useUser, useClerk } from "@clerk/react"
import { useGetMe, useUpdateMe, useDeleteMe } from "@workspace/api-client-react"
import { useToast } from "@/hooks/use-toast"
import { Save, LogOut, AlertTriangle } from "lucide-react"

export function SettingsPage() {
  const { user } = useUser()
  const { signOut } = useClerk()
  const { data: me, isLoading } = useGetMe()
  const updateMe = useUpdateMe()
  const deleteMe = useDeleteMe()
  const { toast } = useToast()

  const [name, setName] = useState(user?.fullName || "")

  const handleSave = () => {
    updateMe.mutate({ data: { name } }, {
      onSuccess: () => {
        toast({ title: "Profile updated successfully" })
      }
    })
  }

  const handleDelete = () => {
    if (confirm("WARNING: This will permanently delete your account and all associated data. This action cannot be undone. Proceed?")) {
      deleteMe.mutate(undefined, {
        onSuccess: () => {
          signOut({ redirectUrl: "/" })
        }
      })
    }
  }

  return (
    <AppLayout title="Settings">
      <div className="max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile Settings</CardTitle>
            <CardDescription>Update your personal information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
                {user?.firstName?.[0] || user?.emailAddresses[0].emailAddress[0].toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email Address</p>
                <p className="font-medium">{user?.emailAddresses[0].emailAddress}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Display Name</label>
              <Input 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="Your name" 
              />
            </div>
          </CardContent>
          <CardFooter className="border-t bg-muted/20 py-4 flex justify-end">
            <Button onClick={handleSave} disabled={updateMe.isPending || isLoading}>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </CardFooter>
        </Card>

        <Card className="border-destructive/20">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" /> Danger Zone
            </CardTitle>
            <CardDescription>Irreversible actions related to your account.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg bg-destructive/5">
              <div>
                <h4 className="font-semibold text-slate-900">Delete Account</h4>
                <p className="text-sm text-slate-600">Remove all your data, analyses, and history forever.</p>
              </div>
              <Button variant="destructive" onClick={handleDelete} disabled={deleteMe.isPending}>
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
