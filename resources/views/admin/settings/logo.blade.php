@extends('layouts.admin')
@include('partials/admin.settings.nav', ['activeTab' => 'logo'])

@section('title')
  Branding
@endsection

@section('content-header')
  <h1>Branding<small>Customize your Hydrodactyl logo.</small></h1>
  <ol class="breadcrumb">
    <li><a href="{{ route('admin.index') }}">Admin</a></li>
    <li><a href="{{ route('admin.settings') }}">Settings</a></li>
    <li class="active">Branding</li>
  </ol>
@endsection

@section('content')
  @yield('settings::nav')

  @if(!$canProcessImages)
    <div class="alert alert-warning" style="margin-bottom:20px;">
      <i class="fa fa-exclamation-triangle"></i> <strong>Image processing unavailable:</strong>
      The PHP GD extension on this server cannot convert images. Uploaded logos will be stored in their original format.
    </div>
  @endif

  <form action="{{ route('admin.settings.logo') }}" method="POST" enctype="multipart/form-data" id="logoForm">
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
                  <path d="M35.1293 92L39.2242 59.3897L44.8276 60.4695L14.2241 81.2019L0 57.0141L32.7586 45.3521V47.7277L0 33.4742L14.2241 8.85446L45.6896 33.2582L39.2242 34.1221L34.4828 0H65.5172L61.4225 33.9061L56.681 32.8263L85.7759 8.85446L100 33.4742L66.1638 47.7277V45.5681L99.569 57.0141L85.3448 81.2019L57.5431 59.3897H61.638L66.1638 92H35.1293Z" fill="{{ $brandColor }}"/>
                </svg>
              </div>
              <div style="margin-top:12px;display:flex;align-items:center;justify-content:center;gap:10px;">
                <img id="faviconPreview" src="{{ $logoUrl ?? '' }}" alt="Favicon" style="width:32px;height:32px;border-radius:4px;border:1px solid #444;{{ $logoUrl ? '' : 'display:none;' }}">
                <span class="text-muted" style="font-size:12px;">{{ $logoUrl ? 'Favicon preview (32×32)' : 'Default favicon is used' }}</span>
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
          <h3 class="box-title">Logo Settings</h3>
        </div>
        <div class="box-body">
          <div class="row">
            <div class="form-group col-md-12">
              <label class="control-label">Company Name</label>
              <input type="text" class="form-control" name="app:name" id="companyNameInput"
                value="{{ old('app:name', config('app.name')) }}" />
              <p class="text-muted small" style="margin-top:4px;">Displayed throughout the panel and in outgoing emails.</p>
            </div>
          </div>
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
                <div id="fileError" class="text-danger" style="display:none;margin-top:8px;font-size:12px;"></div>
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
                    <button type="button" class="btn btn-outline-primary" id="previewUrlBtn">
                      <i class="fa fa-eye"></i>
                    </button>
                  </span>
                </div>
                <p class="text-muted"><small>Enter a direct link to an image hosted elsewhere.</small></p>
                <div id="urlError" class="text-danger" style="display:none;margin-top:8px;font-size:12px;"></div>
                <div id="urlPreview" style="display:none;margin-top:10px;text-align:center;">
                  <img id="urlPreviewImg" src="#" alt="URL Preview" style="max-width:100%;max-height:150px;border-radius:4px;border:1px solid #555;padding:5px;">
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="row">
    <div class="col-md-8 col-md-offset-2">
      <div class="box">
        <div class="box-header with-border">
          <h3 class="box-title">Brand Color</h3>
        </div>
        <div class="box-body">
          <div class="alert alert-warning" style="margin-bottom:20px;">
            <i class="fa fa-exclamation-triangle"></i> <strong>Note:</strong>
            The brand color is currently only used on this page (logo preview, history highlight, and confirmation buttons). It does not yet affect the rest of the panel UI.
          </div>
          <div class="row">
            <div class="form-group col-md-6">
              <label class="control-label">Primary Brand Color</label>
              <div class="input-group">
                <span class="input-group-addon" style="padding:0;border:none;">
                  <input type="color" name="app:brand_color" id="brandColorPicker"
                    value="{{ $brandColor }}"
                    style="width:40px;height:34px;border:none;cursor:pointer;background:transparent;padding:0;">
                </span>
                <input type="text" class="form-control" id="brandColorText"
                  value="{{ $brandColor }}" maxlength="7"
                  style="border-radius:0 4px 4px 0;">
              </div>
              <p class="text-muted small" style="margin-top:4px;">Used for the logo preview and highlights on this page.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="row">
    <div class="col-md-8 col-md-offset-2">
      <div class="box-footer">
        {!! csrf_field() !!}
        <input type="hidden" name="_method" value="PATCH">
        <button type="submit" id="saveBtn" class="btn btn-primary btn-sm btn-outline-primary pull-right" disabled>
          <i class="fa fa-save"></i> Save Changes
        </button>
        @if($logoUrl)
          <button type="button" id="removeLogoBtn" class="btn btn-danger btn-sm btn-outline-danger pull-right" style="margin-right:5px;">
            <i class="fa fa-trash"></i> Remove Logo
          </button>
        @endif
      </div>
    </div>
  </div>
  </form>

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
                <div class="logo-history-item" style="border:2px solid {{ $isCurrent($entry) ? $brandColor : '#444' }};border-radius:8px;padding:10px;cursor:pointer;transition:all 0.2s;{{ $isCurrent($entry) ? 'box-shadow:0 0 8px ' . $brandColor . '4d;' : '' }}" onclick="rewindLogo({{ $index }})" title="Click to use this logo">
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

  <form id="rewindForm" action="{{ route('admin.settings.logo') }}" method="POST" style="display:none;">
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
    var fileError = document.getElementById('fileError');
    var urlInput = document.getElementById('logoUrlInput');
    var urlPreview = document.getElementById('urlPreview');
    var urlPreviewImg = document.getElementById('urlPreviewImg');
    var urlError = document.getElementById('urlError');
    var saveBtn = document.getElementById('saveBtn');
    var logoForm = document.getElementById('logoForm');
    var nameInput = document.getElementById('companyNameInput');
    var originalName = nameInput.value;
    var brandColorPicker = document.getElementById('brandColorPicker');
    var brandColorText = document.getElementById('brandColorText');
    var originalBrandColor = brandColorText.value;

    // Sync brand color picker and text input
    brandColorPicker.addEventListener('input', function() {
      brandColorText.value = this.value;
      updateSaveState();
    });
    brandColorText.addEventListener('input', function() {
      if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(this.value)) {
        brandColorPicker.value = this.value;
      }
      updateSaveState();
    });

    var allowedTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml'];
    var maxSize = 2 * 1024 * 1024; // 2MB

    function updateSaveState() {
      var hasFile = fileInput.files && fileInput.files.length > 0;
      var hasUrl = urlInput.value.trim().length > 0;
      var nameChanged = nameInput.value.trim() !== originalName;
      var colorChanged = brandColorText.value.trim() !== originalBrandColor;
      saveBtn.disabled = !(hasFile || hasUrl || nameChanged || colorChanged);
    }

    dropZone.addEventListener('click', function() {
      fileInput.click();
    });

    dropZone.addEventListener('dragover', function(e) {
      e.preventDefault();
      e.stopPropagation();
      this.style.borderColor = brandColorText.value;
      this.style.background = brandColorText.value + '1a';
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
        handleFileSelect(files[0]);
      }
    });

    fileInput.addEventListener('change', function() {
      if (this.files && this.files[0]) {
        handleFileSelect(this.files[0]);
        urlInput.value = '';
        urlPreview.style.display = 'none';
        urlError.style.display = 'none';
      }
      updateSaveState();
    });

    urlInput.addEventListener('input', function() {
      if (this.value.trim()) {
        fileInput.value = '';
        uploadPreview.style.display = 'none';
        fileError.style.display = 'none';
      }
      updateSaveState();
    });

    nameInput.addEventListener('input', updateSaveState);

    function handleFileSelect(file) {
      fileError.style.display = 'none';

      if (allowedTypes.indexOf(file.type) === -1) {
        fileError.textContent = 'Unsupported file type. Please use PNG, JPG, GIF, WEBP or SVG.';
        fileError.style.display = 'block';
        uploadPreview.style.display = 'none';
        fileInput.value = '';
        return;
      }

      if (file.size > maxSize) {
        fileError.textContent = 'File is too large. Maximum size is 2MB.';
        fileError.style.display = 'block';
        uploadPreview.style.display = 'none';
        fileInput.value = '';
        return;
      }

      if (file.type.match('image.*')) {
        var reader = new FileReader();
        reader.onload = function(e) {
          uploadPreviewImg.src = e.target.result;
          uploadPreview.style.display = 'block';
        };
        reader.readAsDataURL(file);
      }
    }

    document.getElementById('currentLogoImg').onerror = function() {
      this.style.display = 'none';
      document.getElementById('currentLogoSvg').style.display = '';
    };

    document.getElementById('faviconPreview').onerror = function() {
      this.style.display = 'none';
    };

    document.getElementById('previewUrlBtn').addEventListener('click', function() {
      var url = urlInput.value.trim();
      urlError.style.display = 'none';

      if (!url) return;

      urlPreviewImg.src = url;
      urlPreviewImg.onerror = function() {
        urlError.textContent = 'Could not load the image from this URL.';
        urlError.style.display = 'block';
        urlPreview.style.display = 'none';
      };
      urlPreview.style.display = 'block';
      fileInput.value = '';
      uploadPreview.style.display = 'none';
      fileError.style.display = 'none';
      updateSaveState();
    });

    function rewindLogo(index) {
      swal({
        title: '',
        type: 'warning',
        text: 'Switch to this logo version?',
        showCancelButton: true,
        confirmButtonText: 'Switch',
        confirmButtonColor: '{{ $brandColor }}',
        closeOnConfirm: false
      }, function() {
        document.getElementById('rewindInput').value = index;
        document.getElementById('rewindForm').submit();
      });
    }

    var removeLogoBtn = document.getElementById('removeLogoBtn');
    if (removeLogoBtn) {
      removeLogoBtn.addEventListener('click', function(e) {
        e.preventDefault();
        swal({
          title: '',
          type: 'warning',
          text: 'Remove custom logo and restore default?',
          showCancelButton: true,
          confirmButtonText: 'Remove',
          confirmButtonColor: '#d9534f',
          closeOnConfirm: false
        }, function() {
          var input = document.createElement('input');
          input.type = 'hidden';
          input.name = 'remove';
          input.value = '1';
          logoForm.appendChild(input);
          logoForm.submit();
        });
      });
    }

    updateSaveState();
  </script>
@endsection