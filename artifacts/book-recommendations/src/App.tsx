import { useEffect, useRef, type ReactNode } from 'react';
import { ClerkProvider, SignIn, SignUp, useClerk } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Redirect, Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import BookGuide from './BookGuide';

const queryClient = new QueryClient();
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
const clerkPubKey = publishableKeyFromHost(window.location.hostname, import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

function stripBase(path: string) {
  return basePath && path.startsWith(basePath) ? path.slice(basePath.length) || '/' : path;
}

if (!clerkPubKey) throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env file');

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: 'clerk',
  options: {
    logoPlacement: 'inside' as const,
    logoLinkUrl: basePath || '/',
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: '#28594d',
    colorForeground: '#244b40',
    colorMutedForeground: '#687970',
    colorDanger: '#a7483c',
    colorBackground: '#f7f5ed',
    colorInput: '#fbfaf5',
    colorInputForeground: '#244b40',
    colorNeutral: '#d8d6ca',
    fontFamily: "'DM Sans', sans-serif",
    borderRadius: '0.75rem',
  },
  elements: {
    rootBox: 'w-full flex justify-center',
    cardBox: 'bg-[#f7f5ed] rounded-2xl w-[440px] max-w-full overflow-hidden shadow-xl',
    card: '!shadow-none !border-0 !bg-transparent !rounded-none',
    footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
    headerTitle: 'text-[#244b40] font-semibold',
    headerSubtitle: 'text-[#687970]',
    socialButtonsBlockButtonText: 'text-[#244b40] font-medium',
    formFieldLabel: 'text-[#36594d] font-medium',
    footerActionLink: 'text-[#28594d] font-semibold',
    footerActionText: 'text-[#687970]',
    dividerText: 'text-[#77847a]',
    identityPreviewEditButton: 'text-[#28594d]',
    formFieldSuccessText: 'text-[#28594d]',
    alertText: 'text-[#8d3d34]',
    logoBox: 'mb-2',
    logoImage: 'rounded-lg',
    socialButtonsBlockButton: 'border-[#d8d6ca] bg-[#fbfaf5] hover:bg-[#eeece2]',
    formButtonPrimary: 'bg-[#28594d] hover:bg-[#1e493d] text-[#f7f2e8]',
    formFieldInput: 'bg-[#fbfaf5] border-[#d8d6ca] text-[#244b40]',
    footerAction: 'bg-transparent',
    dividerLine: 'bg-[#ded9cb]',
    alert: 'bg-[#f5e5de] border-[#e8c8ba]',
    otpCodeFieldInput: 'bg-[#fbfaf5] border-[#d8d6ca] text-[#244b40]',
    formFieldRow: 'mb-4',
    main: 'text-[#244b40]',
  },
};

function CacheInvalidator() {
  const { addListener } = useClerk();
  const client = useQueryClient();
  const previousId = useRef<string | null | undefined>(undefined);
  useEffect(() => addListener(({ user }) => {
    const nextId = user?.id ?? null;
    if (previousId.current !== undefined && previousId.current !== nextId) client.clear();
    previousId.current = nextId;
  }), [addListener, client]);
  return null;
}

function AuthRoutes() {
  const [, setLocation] = useLocation();
  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: { start: { title: 'Welcome back', subtitle: 'Your next good read is waiting.' } },
        signUp: { start: { title: 'Find your next chapter', subtitle: 'Save books and share your ratings.' } },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <CacheInvalidator />
        <TooltipProvider>
          <Switch>
            <Route path="/sign-in/*?">
              <div className="auth-screen"><div className="auth-note"><span className="brand-mark"><BookGuideLogo /></span><p>BETWEEN THE COVERS</p><h1>Find a story<br />that feels like <em>you.</em></h1><span>Keep your own shelf, rate what you read, and find the next one.</span></div><SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} /></div>
            </Route>
            <Route path="/sign-up/*?">
              <div className="auth-screen"><div className="auth-note"><span className="brand-mark"><BookGuideLogo /></span><p>BETWEEN THE COVERS</p><h1>A little shelf<br />of your <em>own.</em></h1><span>Start collecting the books you want to remember.</span></div><SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} /></div>
            </Route>
            <Route path="/">
              <RoutedBoundary><BookGuide redirectSignedIn /></RoutedBoundary>
            </Route>
            <Route path="/user-portal">
              <RoutedBoundary><BookGuide portal /></RoutedBoundary>
            </Route>
            <Route><NotFound /></Route>
          </Switch>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function BookGuideLogo() {
  return <span aria-hidden="true">B</span>;
}

function RoutedBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return <WouterRouter base={basePath}><AuthRoutes /></WouterRouter>;
}

export default App;
