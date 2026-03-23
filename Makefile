PNPM ?= pnpm

.PHONY: install dev dev-software-factory dev-platform dev-docs lint typecheck test build check clean sync

install:
	$(PNPM) install --no-frozen-lockfile

dev:
	$(PNPM) dev

dev-software-factory:
	$(PNPM) dev:software-factory

dev-platform:
	$(PNPM) dev:platform

dev-docs:
	$(PNPM) dev:docs

lint:
	$(PNPM) lint

typecheck:
	$(PNPM) typecheck

test:
	$(PNPM) test

build:
	$(PNPM) build

check:
	$(PNPM) check

clean:
	$(PNPM) clean

sync:
	$(PNPM) sync:tokens
	$(PNPM) sync:proto
	$(PNPM) sync:openapi
