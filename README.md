# Emerald Admin Dashboard

please add missing features and make admin dashboard fully professional and i want below color theme in my live site and show me here RoleColourHexPrimary (buttons, links)Emerald green#16A34APrimary hoverDarker green#15803DHeadings, header, footerDeep navy#0F172ABody textSlate#334155Muted textLight slate#64748BBordersSoft grey#E2E8F0Page backgroundOff-white#F8FAFCCardsWhite#FFFFFFAccent (badges, highlights)Blue#2563EBSuccessGreen#16A34AWarning (“Sale in progress”, pending)Amber#F59E0BDanger (delete, errors)Red#DC2626

Dark mode (optional): background #0B1220, cards #111A2E, text #E2E8F0, borders #1E293B, and the same green primary.

Quick paste for your AI tool

css

:root {
  --primary: #16A34A;  --primary-hover: #15803D;
  --navy: #0F172A;     --text: #334155;     --muted: #64748B;
  --border: #E2E8F0;   --bg: #F8FAFC;       --card: #FFFFFF;
  --accent: #2563EB;   --success: #16A34A;  --warning: #F59E0B;  --danger: #DC2626;
}

Usage tips

Use green only for the main action on a screen (Buy, Make offer, Verify).

Use navy for headings and the header, with white text on it.

Keep amber for “in progress” states and red only for destructive actions.

Check the contrast of white text on the green button. #15803D is safer for small text on buttons.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/cfad5687-c4aa-4ad6-b97e-40260dd3d332).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
