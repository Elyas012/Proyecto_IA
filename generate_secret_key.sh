#!/bin/bash
# Generate a new Django SECRET_KEY for production

echo "=== Django SECRET_KEY Generator ==="
echo ""
echo "Generating a secure SECRET_KEY..."
echo ""

cd backed_django

python -c "from django.core.management.utils import get_random_secret_key; print('SECRET_KEY=' + get_random_secret_key())"

echo ""
echo "Copy the SECRET_KEY above and paste it in:"
echo "  - Railway Environment Variables"
echo "  - .env.production.example"
echo ""
echo "Done! ✅"
