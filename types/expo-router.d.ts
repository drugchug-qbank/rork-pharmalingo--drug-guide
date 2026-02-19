import 'expo-router';

declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string | object = string> {
      hrefInputParams:
        | { pathname: import('expo-router').RelativePathString; params?: import('expo-router').UnknownInputParams }
        | { pathname: import('expo-router').ExternalPathString; params?: import('expo-router').UnknownInputParams }
        | { pathname: `/`; params?: import('expo-router').UnknownInputParams }
        | { pathname: `/(tabs)`; params?: import('expo-router').UnknownInputParams }
        | { pathname: `/_sitemap`; params?: import('expo-router').UnknownInputParams }
        | { pathname: `/+not-found`; params?: import('expo-router').UnknownInputParams }
        | { pathname: `/modal`; params?: import('expo-router').UnknownInputParams }
        | { pathname: `/lesson`; params?: import('expo-router').UnknownInputParams }
        | { pathname: `/lesson-complete`; params?: import('expo-router').UnknownInputParams }
        | { pathname: `/auth`; params?: import('expo-router').UnknownInputParams }
        | { pathname: `/auth/welcome`; params?: import('expo-router').UnknownInputParams }
        | { pathname: `/auth/sign-in`; params?: import('expo-router').UnknownInputParams }
        | { pathname: `/auth/sign-up`; params?: import('expo-router').UnknownInputParams }
        | { pathname: `/auth/email-confirmation`; params?: import('expo-router').UnknownInputParams }
        | { pathname: `/auth/complete-profile`; params?: import('expo-router').UnknownInputParams }
        | { pathname: `/(tabs)/(learn)`; params?: import('expo-router').UnknownInputParams }
        | { pathname: `/(tabs)/(learn)/chapter/[id]`; params: import('expo-router').UnknownInputParams & { id: string } }
        | { pathname: `/chapter/${string}`; params?: import('expo-router').UnknownInputParams }
        | { pathname: `/(tabs)/leaderboard`; params?: import('expo-router').UnknownInputParams }
        | { pathname: `/(tabs)/practice`; params?: import('expo-router').UnknownInputParams }
        | { pathname: `/(tabs)/profile`; params?: import('expo-router').UnknownInputParams }
        | { pathname: `/(tabs)/shop`; params?: import('expo-router').UnknownInputParams }
        | { pathname: `/shop`; params?: import('expo-router').UnknownInputParams };
      hrefOutputParams:
        | { pathname: import('expo-router').RelativePathString; params?: import('expo-router').UnknownOutputParams }
        | { pathname: import('expo-router').ExternalPathString; params?: import('expo-router').UnknownOutputParams }
        | { pathname: `/`; params?: import('expo-router').UnknownOutputParams }
        | { pathname: `/(tabs)`; params?: import('expo-router').UnknownOutputParams }
        | { pathname: `/_sitemap`; params?: import('expo-router').UnknownOutputParams }
        | { pathname: `/+not-found`; params?: import('expo-router').UnknownOutputParams }
        | { pathname: `/modal`; params?: import('expo-router').UnknownOutputParams }
        | { pathname: `/lesson`; params?: import('expo-router').UnknownOutputParams }
        | { pathname: `/lesson-complete`; params?: import('expo-router').UnknownOutputParams }
        | { pathname: `/auth`; params?: import('expo-router').UnknownOutputParams }
        | { pathname: `/auth/welcome`; params?: import('expo-router').UnknownOutputParams }
        | { pathname: `/auth/sign-in`; params?: import('expo-router').UnknownOutputParams }
        | { pathname: `/auth/sign-up`; params?: import('expo-router').UnknownOutputParams }
        | { pathname: `/auth/email-confirmation`; params?: import('expo-router').UnknownOutputParams }
        | { pathname: `/auth/complete-profile`; params?: import('expo-router').UnknownOutputParams }
        | { pathname: `/(tabs)/(learn)`; params?: import('expo-router').UnknownOutputParams }
        | { pathname: `/(tabs)/(learn)/chapter/[id]`; params: import('expo-router').UnknownOutputParams & { id: string } }
        | { pathname: `/chapter/${string}`; params?: import('expo-router').UnknownOutputParams }
        | { pathname: `/(tabs)/leaderboard`; params?: import('expo-router').UnknownOutputParams }
        | { pathname: `/(tabs)/practice`; params?: import('expo-router').UnknownOutputParams }
        | { pathname: `/(tabs)/profile`; params?: import('expo-router').UnknownOutputParams }
        | { pathname: `/(tabs)/shop`; params?: import('expo-router').UnknownOutputParams }
        | { pathname: `/shop`; params?: import('expo-router').UnknownOutputParams };
      href:
        | import('expo-router').RelativePathString
        | import('expo-router').ExternalPathString
        | `/${`?${string}` | `#${string}` | ''}`
        | `/(tabs)${`?${string}` | `#${string}` | ''}`
        | `/_sitemap${`?${string}` | `#${string}` | ''}`
        | `/+not-found${`?${string}` | `#${string}` | ''}`
        | `/modal${`?${string}` | `#${string}` | ''}`
        | `/lesson${`?${string}` | `#${string}` | ''}`
        | `/lesson-complete${`?${string}` | `#${string}` | ''}`
        | `/auth${`?${string}` | `#${string}` | ''}`
        | `/auth/welcome${`?${string}` | `#${string}` | ''}`
        | `/auth/sign-in${`?${string}` | `#${string}` | ''}`
        | `/auth/sign-up${`?${string}` | `#${string}` | ''}`
        | `/auth/email-confirmation${`?${string}` | `#${string}` | ''}`
        | `/auth/complete-profile${`?${string}` | `#${string}` | ''}`
        | `/(tabs)/(learn)${`?${string}` | `#${string}` | ''}`
        | `/(tabs)/(learn)/chapter/${string}${`?${string}` | `#${string}` | ''}`
        | `/chapter/${string}${`?${string}` | `#${string}` | ''}`
        | `/(tabs)/leaderboard${`?${string}` | `#${string}` | ''}`
        | `/(tabs)/practice${`?${string}` | `#${string}` | ''}`
        | `/(tabs)/profile${`?${string}` | `#${string}` | ''}`
        | `/(tabs)/shop${`?${string}` | `#${string}` | ''}`
        | `/shop${`?${string}` | `#${string}` | ''}`
        | { pathname: import('expo-router').RelativePathString; params?: import('expo-router').UnknownInputParams }
        | { pathname: import('expo-router').ExternalPathString; params?: import('expo-router').UnknownInputParams }
        | { pathname: `/`; params?: import('expo-router').UnknownInputParams }
        | { pathname: `/(tabs)`; params?: import('expo-router').UnknownInputParams }
        | { pathname: `/_sitemap`; params?: import('expo-router').UnknownInputParams }
        | { pathname: `/+not-found`; params?: import('expo-router').UnknownInputParams }
        | { pathname: `/modal`; params?: import('expo-router').UnknownInputParams }
        | { pathname: `/lesson`; params?: import('expo-router').UnknownInputParams }
        | { pathname: `/lesson-complete`; params?: import('expo-router').UnknownInputParams }
        | { pathname: `/auth`; params?: import('expo-router').UnknownInputParams }
        | { pathname: `/auth/welcome`; params?: import('expo-router').UnknownInputParams }
        | { pathname: `/auth/sign-in`; params?: import('expo-router').UnknownInputParams }
        | { pathname: `/auth/sign-up`; params?: import('expo-router').UnknownInputParams }
        | { pathname: `/auth/email-confirmation`; params?: import('expo-router').UnknownInputParams }
        | { pathname: `/auth/complete-profile`; params?: import('expo-router').UnknownInputParams }
        | { pathname: `/(tabs)/(learn)`; params?: import('expo-router').UnknownInputParams }
        | { pathname: `/(tabs)/(learn)/chapter/[id]`; params: import('expo-router').UnknownInputParams & { id: string } }
        | { pathname: `/chapter/${string}`; params?: import('expo-router').UnknownInputParams }
        | { pathname: `/(tabs)/leaderboard`; params?: import('expo-router').UnknownInputParams }
        | { pathname: `/(tabs)/practice`; params?: import('expo-router').UnknownInputParams }
        | { pathname: `/(tabs)/profile`; params?: import('expo-router').UnknownInputParams }
        | { pathname: `/(tabs)/shop`; params?: import('expo-router').UnknownInputParams }
        | { pathname: `/shop`; params?: import('expo-router').UnknownInputParams };
    }
  }
}
