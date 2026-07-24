@extends('layouts.admin')
@include('partials/admin.settings.nav', ['activeTab' => 'logo'])

@section('title')
  Branding
@endsection

@section('content-header')
  <h1>Branding<small>Customize your Hydrodactyl logo.</small></h1>
  <ol class="breadcrumb">
    <li><a href="{{ route('admin.index') }}">Admin</a></li>
    <li><a href="{{ route('admin.depr.settings') }}">Settings</a></li>
    <li class="active">Branding</li>
  </ol>
@endsection

@section('content')
  @yield('settings::nav')
  <div class="alert alert-info" style="margin-bottom:20px;">
    <i class="fa fa-flask"></i> <strong>Experimental:</strong> Logo customization is a new, experimental feature. Some aspects may change in future updates.
  </div>

  <div class="row">
    <div class="col-xs-12">
      <div class="box">
        <div class="box-header with-border">
          <h3 class="box-title">Current Logo</h3>
        </div>
        <div class="box-body">
          <div class="row">
            <div class="col-md-4 col-md-offset-4 text-center">
              <div id="currentLogoPreview" style="min-height:120px;display:flex;align-items:center;justify-content:center;border-radius:6px;">
                <img id="currentLogoImg" src="{{ $logoUrl ?? '' }}" alt="Current Logo" style="max-width:100%;max-height:200px;border-radius:4px;{{ $logoUrl ? '' : 'display:none;' }}">
                <svg id="currentLogoSvg" width="80" height="80" viewBox="0 0 100 92" fill="none" xmlns="http://www.w3.org/2000/svg" style="{{ $logoUrl ? 'display:none;' : '' }}">
                  <path d="M35.1293 92L39.2242 59.3897L44.8276 60.4695L14.2241 81.2019L0 57.0141L32.7586 45.3521V47.7277L0 33.4742L14.2241 8.85446L45.6896 33.2582L39.2242 34.1221L34.4828 0H65.5172L61.4225 33.9061L56.681 32.8263L85.7759 8.85446L100 33.4742L66.1638 47.7277V45.5681L99.569 57.0141L85.3448 81.2019L57.5431 59.3897H61.638L66.1638 92H35.1293Z" fill="#52A9FF"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="row">
    <div class="col-xs-12">
      <div class="box">
        <div class="box-header with-border">
          <h3 class="box-title">Upload New Logo</h3>
        </div>
        <form action="{{ route('admin.depr.settings.logo') }}" method="POST" enctype="multipart/form-data" id="logoForm">
          <div class="box-body">
            <div class="row">
              <div class="col-md-6">
                <div class="form-group">
                  <label class="control-label">Upload Logo</label>
                  <div id="dropZone" class="well well-sm text-center" style="padding:40px 20px;border:2px dashed #555;border-radius:8px;cursor:pointer;transition:all 0.2s;background:transparent;">
                    <i class="fa fa-cloud-upload" style="font-size:48px;color:#999;display:block;margin-bottom:10px;"></i>
                    <p style="margin:0;color:#666;font-size:14px;">
                      <strong>Click to choose</strong> or drag and drop
                    </p>
                    <p style="margin:5px 0 0;color:#999;font-size:12px;">
                      PNG, JPG, GIF, WEBP or SVG (max 2MB)
                    </p>
                    <input type="file" name="logo_file" id="logoFileInput" accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml" style="display:none;">
                  </div>
                  <div id="uploadPreview" style="display:none;margin-top:10px;text-align:center;">
                    <img id="uploadPreviewImg" src="#" alt="Preview" style="max-width:100%;max-height:150px;border-radius:4px;border:1px solid #555;padding:5px;">
                    <p class="text-muted" style="margin-top:5px;font-size:12px;">Preview</p>
                  </div>
                </div>
              </div>
              <div class="col-md-6">
                <div class="form-group">
                  <label class="control-label">Or use a URL</label>
                  <div class="input-group">
                    <input type="url" name="logo_url" id="logoUrlInput" class="form-control" placeholder="https://example.com/logo.png">
                    <span class="input-group-btn">
                      <button type="button" class="btn btn-outline-primary" id="previewUrlBtn" onclick="previewUrl()">
                        <i class="fa fa-eye"></i>
                      </button>
                    </span>
                  </div>
                  <p class="text-muted"><small>Enter a direct link to an image hosted elsewhere.</small></p>
                  <div id="urlPreview" style="display:none;margin-top:10px;text-align:center;">
                    <img id="urlPreviewImg" src="#" alt="URL Preview" style="max-width:100%;max-height:150px;border-radius:4px;border:1px solid #555;padding:5px;">
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="box-footer">
            {!! csrf_field() !!}
            <input type="hidden" name="_method" value="PATCH">
            <button type="submit" class="btn btn-primary btn-sm btn-outline-primary pull-right">
              <i class="fa fa-save"></i> Save Logo
            </button>
            @if($logoUrl)
              <button type="submit" name="remove" value="1" class="btn btn-danger btn-sm btn-outline-danger pull-right" style="margin-right:5px;" onclick="return confirm('Remove custom logo and restore default?');">
                <i class="fa fa-trash"></i> Remove Logo
              </button>
            @endif
          </div>
        </form>
      </div>
    </div>
  </div>

  @if(count($history) > 0)
  <div class="row">
    <div class="col-xs-12">
      <div class="box">
        <div class="box-header with-border">
          <h3 class="box-title">Logo History <small class="text-muted">Last 10 logos</small></h3>
        </div>
        <div class="box-body">
              <div class="row" id="logoHistory">
              @php $isCurrent = fn($entry) => $logoType && $logoValue && $entry['type'] === $logoType && $entry['value'] === $logoValue; @endphp
              @foreach($history as $index => $entry)
              <div class="col-md-2 col-sm-3 col-xs-4 text-center" style="margin-bottom:15px;">
                <div class="logo-history-item" style="border:2px solid {{ $isCurrent($entry) ? '#52A9FF' : '#444' }};border-radius:8px;padding:10px;cursor:pointer;transition:all 0.2s;{{ $isCurrent($entry) ? 'box-shadow:0 0 8px rgba(82,169,255,0.3);' : '' }}" onclick="rewindLogo({{ $index }})" title="Click to use this logo">
                  @if($entry['type'] === 'upload')
                    <img src="{{ url('storage/' . $entry['value']) }}" alt="Logo {{ $index + 1 }}" style="max-width:100%;max-height:80px;border-radius:4px;" onerror="this.closest('.logo-history-item').style.display='none'">
                  @else
                    <img src="{{ $entry['value'] }}" alt="Logo {{ $index + 1 }}" style="max-width:100%;max-height:80px;border-radius:4px;" onerror="this.closest('.logo-history-item').style.display='none'">
                  @endif
                  @if($isCurrent($entry))
                    <p class="text-primary" style="margin:5px 0 0;font-size:11px;font-weight:600;">Current</p>
                  @else
                    <p class="text-muted" style="margin:5px 0 0;font-size:11px;">#{{ $index + 1 }}</p>
                  @endif
                </div>
              </div>
              @endforeach
          </div>
        </div>
      </div>
    </div>
  </div>
  @endif

  <form id="rewindForm" action="{{ route('admin.depr.settings.logo') }}" method="POST" style="display:none;">
    {!! csrf_field() !!}
    <input type="hidden" name="_method" value="PATCH">
    <input type="hidden" name="rewind" id="rewindInput" value="">
  </form>
@endsection

@section('footer-scripts')
  @parent
  <script>
    var dropZone = document.getElementById('dropZone');
    var fileInput = document.getElementById('logoFileInput');
    var uploadPreview = document.getElementById('uploadPreview');
    var uploadPreviewImg = document.getElementById('uploadPreviewImg');
    var urlInput = document.getElementById('logoUrlInput');
    var urlPreview = document.getElementById('urlPreview');
    var urlPreviewImg = document.getElementById('urlPreviewImg');
    var logoForm = document.getElementById('logoForm');

    dropZone.addEventListener('click', function() {
      fileInput.click();
    });

    dropZone.addEventListener('dragover', function(e) {
      e.preventDefault();
      e.stopPropagation();
      this.style.borderColor = '#52A9FF';
      this.style.background = 'rgba(82,169,255,0.1)';
    });

    dropZone.addEventListener('dragleave', function(e) {
      e.preventDefault();
      e.stopPropagation();
      this.style.borderColor = '#555';
      this.style.background = 'transparent';
    });

    dropZone.addEventListener('drop', function(e) {
      e.preventDefault();
      e.stopPropagation();
      this.style.borderColor = '#555';
      this.style.background = 'transparent';

      var files = e.dataTransfer.files;
      if (files.length > 0) {
        fileInput.files = files;
        showFilePreview(files[0]);
      }
    });

    fileInput.addEventListener('change', function() {
      if (this.files && this.files[0]) {
        showFilePreview(this.files[0]);
        urlInput.value = '';
        urlPreview.style.display = 'none';
      }
    });

    function showFilePreview(file) {
      if (!file.type.match('image.*')) return;

      var reader = new FileReader();
      reader.onload = function(e) {
        uploadPreviewImg.src = e.target.result;
        uploadPreview.style.display = 'block';
      };
      reader.readAsDataURL(file);
    }

    document.getElementById('currentLogoImg').onerror = function() {
      this.style.display = 'none';
      document.getElementById('currentLogoSvg').style.display = '';
    };

    function previewUrl() {
      var url = urlInput.value.trim();
      if (!url) return;

      urlPreviewImg.src = url;
      urlPreview.style.display = 'block';
      fileInput.value = '';
      uploadPreview.style.display = 'none';
    }

    function rewindLogo(index) {
      if (confirm('Switch to this logo version?')) {
        document.getElementById('rewindInput').value = index;
        document.getElementById('rewindForm').submit();
      }
    }
  </script>
@endsection
