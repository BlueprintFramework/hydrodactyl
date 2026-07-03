@extends('layouts.admin')

@section('title')
  Administration
@endsection

@section('content-header')
  <h1>Administrative Overview<small>A quick glance at your system.</small></h1>
  <ol class="breadcrumb">
    <li><a href="{{ route('admin.index') }}">Admin</a></li>
    <li class="active">Index</li>
  </ol>
@endsection

@section('content')
  <div class="row">
    <div class="col-xs-12">
      <div class="box">
        <div class="box-header with-border">
          <h3 class="box-title">System Information</h3>
        </div>
        <div class="box-body">
          You are running Hydrodactyl panel version <code>{{ config('app.version') }}</code>.
        </div>
      </div>
    </div>
  </div>

  <div id="admin-dashboard"></div>
  <div class="row">
    <div class="col-xs-6 col-sm-3 text-center">
    <a href="https://discord.gg/mnTJVSSaKp"><button class="btn btn-warning" style="width:100%;"><i
        class="fa fa-fw fa-support"></i> Get Help <small>(via Discord)</small></button></a>
    </div>
    <div class="col-xs-6 col-sm-3 text-center">
    <a href="https://hydrodactyl.dev"><button class="btn btn-primary" style="width:100%;"><i
        class="fa fa-fw fa-link"></i> Documentation</button></a>
    </div>
    <div class="clearfix visible-xs-block">&nbsp;</div>
    <div class="col-xs-6 col-sm-3 text-center">
    <a href="https://github.com/BlueprintFramework/hydrodactyl"><button class="btn btn-primary" style="width:100%;"><i
        class="fa fa-fw fa-support"></i> Github</button></a>
    </div>
    <div class="col-xs-6 col-sm-3 text-center">
    <button class="btn btn-success" style="width:100%;" data-toggle="modal" data-target="#supportModal"><i
        class="fa fa-fw fa-money"></i> Support the Project</button>
    </div>
  </div>

  <div class="modal fade" id="supportModal" tabindex="-1" role="dialog">
    <div class="modal-dialog" role="document">
      <div class="modal-content">
        <div class="modal-header">
          <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
          <h4 class="modal-title"><i class="fa fa-fw fa-heart" style="color:#e74c3c;"></i> Support the Project</h4>
        </div>
        <div class="modal-body">
          <p style="margin-bottom:16px;">Hydrodactyl is built and maintained by volunteers. If you'd like to help, here are a few ways:</p>
          <div class="list-group" style="margin-bottom:0;">
            <a href="https://ko-fi.com/naterfute" target="_blank" rel="noopener" class="list-group-item support-item">
              <h4 class="list-group-item-heading"><i class="fa fa-fw fa-coffee"></i> Ko-Fi</h4>
              <p class="list-group-item-text">Donate to support the maintainer — every bit helps!</p>
            </a>
            <a href="https://bpfw.io/donate" target="_blank" rel="noopener" class="list-group-item support-item">
              <h4 class="list-group-item-heading"><i class="fa fa-fw fa-gift"></i> Blueprint</h4>
              <p class="list-group-item-text">Donate to the nonprofit funding Hydrodactyl development.</p>
            </a>
            <a href="https://discord.gg/sK686yHdaK" target="_blank" rel="noopener" class="list-group-item support-item">
              <h4 class="list-group-item-heading"><i class="fa fa-fw fa-comments"></i> Discord</h4>
              <p class="list-group-item-text">Join the community, ask questions, and stay up to date.</p>
            </a>
            <div class="list-group-item support-item">
              <h4 class="list-group-item-heading"><i class="fa fa-fw fa-star"></i> Share</h4>
              <p class="list-group-item-text">Star the repo on GitHub and share it with someone who might find it useful!</p>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
        </div>
      </div>
    </div>
  </div>
@endsection

@section('footer-scripts')
  @parent
  <style>
    #admin-dashboard .small-box { transition: transform 0.2s ease; }
    #admin-dashboard .small-box:hover { transform: translateY(-3px); }
    .support-item { background:#222 !important; border-color:#444 !important; color:#ccc !important; }
    .support-item:hover { background:#2a2a2a !important; border-color:#52A9FF !important; }
    .support-item .list-group-item-heading { color:#eee !important; }
    .support-item .list-group-item-text { color:#999 !important; }
  </style>
@endsection
