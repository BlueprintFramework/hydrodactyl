<?php

namespace Pterodactyl\Http\Controllers\Admin;

use Illuminate\View\View;
use Illuminate\View\Factory as ViewFactory;
use Pterodactyl\Http\Controllers\Controller;

class AppController extends Controller
{
    /**
     * AppController constructor.
     */
    public function __construct(private ViewFactory $view)
    {
    }

    /**
     * Return the admin application shell that mounts the React admin interface.
     */
    public function index(): View
    {
        return $this->view->make('templates.admin.core');
    }
}
