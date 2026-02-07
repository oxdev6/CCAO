# Hackathon Feedback

## Overall experience

We built CCAO (Confidential Cross-Chain Asset Orchestrator) as a privacy-preserving sealed-bid auction platform using iExec's TEE stack and cross-chain settlement. The experience was positive: we could integrate smart contracts, a Next.js frontend, and iExec TEE tasks in one repo and document everything for judges.

## What went well

- **Clear separation of concerns**: Contracts (Foundry), TEE tasks (Python + Docker + `iexec.json`), and frontend (Next.js) are in distinct folders, which made development and review straightforward.
- **iExec integration**: Having `iexec.json` in each `tee-tasks/` app made it obvious where the iExec application lives and how it would be deployed.
- **Documentation**: The README and this feedback file give judges a single place to understand the project and how to run it.

## Challenges

- **End-to-end wiring**: Connecting the frontend to a live contract and to iExec task execution in a short timeframe was tight; we focused on a working UI and clear contract + TEE interfaces, with deployment and env config documented for post-hackathon completion.
- **Wallet and UX**: We improved wallet detection and made the submit button and auction selection responsive so the demo flow is clear.

## Takeaways

We’re leaving the hackathon with a clean, documented codebase that shows confidential sealed-bid auctions with iExec TEE and cross-chain settlement. We plan to deploy contracts and iExec apps to testnets and complete the full on-chain + TEE flow.

Thank you to the organizers and iExec for the infrastructure and support.
