# SETTINGS #
MAKEFLAGS		+=	--silent
NAME			=	transcendence
VOLUME		=	transcendence_postgres
DOCKER_COMPOSE	=	./docker-compose.yml

#------------------------------------------------------------------------------#

# Basic rules #
all:		build up
.PHONY:		all

$(NAME):	all
.PHONY:		$(NAME)

# Managing rules #
down:
			echo -n "Removing '$(NAME)' containers...\n"
			docker compose -f $(DOCKER_COMPOSE) down
.PHONY:		down

up:
			echo -n "Starting '$(NAME)' containers...\n"
			docker compose -f $(DOCKER_COMPOSE) up -d
.PHONY:		up

attach:
			echo -n "Attaching '$(NAME)' containers...\n"
			docker compose -f $(DOCKER_COMPOSE) up
.PHONY:		attach

stop:
			echo -n "Stopping '$(NAME)' containers...\n"
			docker compose -f $(DOCKER_COMPOSE) stop
.PHONY:		stop

start:		up
.PHONY:		start

restart:	stop start
.PHONY:		restart

ps:
			docker compose -f $(DOCKER_COMPOSE) ps
.PHONY:		ps

frontend:
			echo -n "Connecting to '$@' containers...\n"
			docker container exec -it $@ sh
.PHONY:		frontend

backend:
			echo -n "Connecting to '$@' containers...\n"
			docker container exec -it $@ sh
.PHONY:		backend

postgresql:
			echo -n "Connecting to '$@' containers...\n"
			docker container exec -it $@ sh
.PHONY:		postgresql

db:
	docker start postgresql

# Building rules #
build:
			echo -n "Building '$(NAME)' images...\n"
			docker compose -f $(DOCKER_COMPOSE) build
.PHONY:		build

rebuild:	down
			echo -n "Rebuilding '$(NAME)' images...\n"
			docker compose -f $(DOCKER_COMPOSE) build --no-cache
.PHONY:		rebuild

re:			rebuild up
.PHONY:		re

# Cleaning rules #
clean:
			docker compose -f $(DOCKER_COMPOSE) rm -f -s
			echo -n "🗑️  '$(NAME)' has been deleted.\n"
.PHONY:		clean

fclean:		clean
			echo -n "Warning ! You are going to delete $(VOLUME), are you sure to continue ? [y/N]\n"
			read choice; \
			if [ "$$choice" = "y" ]; then \
				docker volume rm $(VOLUME); \
				echo -n "🗑️  '$(VOLUME)' has been deleted.\n"; \
			else \
				echo -n "Abord.\n"; \
			fi
.PHONY:		fclean

purge:	clean
			echo -n "Warning ! You are going to delete every docker container and image on your pc, are you sure to continue ? [y/N]\n"
			read choice; \
			if [ "$$choice" = "y" ]; then \
				docker volume rm $$(docker volume ls -q) 2>/dev/null; \
				echo -n "🗑️  Every volume has been deleted.\n"; \
				docker builder prune -a -f; \
				echo -n "🗑️  'Builder cache' has been deleted.\n"; \
				docker buildx prune -a -f; \
				echo -n "🗑️  'Buildx cache' has been deleted.\n"; \
				docker rmi -f $$(docker images -a -q) 2>/dev/null; \
				echo -n "🗑️  'Docker images' has been deleted.\n"; \
			else \
				echo -n "Abord.\n"; \
			fi
.PHONY:		purge
