# Canary Deployment Guide

## Steps
1. Deploy canary: `kubectl apply -f canary-deployment.yaml`
2. Monitor: watch error rates and latency
3. Promote: scale canary to 100%, remove old deployment
4. Rollback: delete canary deployment

## Traffic Split
- Start: 10% canary, 90% stable
- Promote: 50/50
- Complete: 100% canary → becomes stable
