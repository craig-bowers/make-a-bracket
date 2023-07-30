import styles from './styles.module.scss';

import React from 'react';

// MUI contexts
import { useTheme } from '@mui/material/styles';

// Tiptap
import { EditorContent, useEditor } from '@tiptap/react';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import { Color } from '@tiptap/extension-color';
import ListItem from '@tiptap/extension-list-item';
import TextStyle from '@tiptap/extension-text-style';
import Image from '@tiptap/extension-image';
import Youtube from '@tiptap/extension-youtube';
import StarterKit from '@tiptap/starter-kit';
import { JSONContent } from '@tiptap/react';

// React Colorful
import { HexColorPicker } from 'react-colorful';

// MUI
import {
  AppBar,
  Autocomplete,
  Box,
  Button,
  ButtonGroup,
  Container,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  Link as MUILink,
  Menu,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  Toolbar,
  Typography,
  TextField,
} from '@mui/material';
// Icons
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import StrikethroughSIcon from '@mui/icons-material/StrikethroughS';
import CodeIcon from '@mui/icons-material/Code';
import FormatClearIcon from '@mui/icons-material/FormatClear';
import LayersClearIcon from '@mui/icons-material/LayersClear';
import FormatSizeIcon from '@mui/icons-material/FormatSize';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import HorizontalRuleIcon from '@mui/icons-material/HorizontalRule';
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import FormatColorTextIcon from '@mui/icons-material/FormatColorText';
import ImageIcon from '@mui/icons-material/Image';
import AddIcon from '@mui/icons-material/Add';
import IntegrationInstructionsIcon from '@mui/icons-material/IntegrationInstructions';
import YouTubeIcon from '@mui/icons-material/YouTube';
import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft';
import FormatAlignCenterIcon from '@mui/icons-material/FormatAlignCenter';
import FormatAlignRightIcon from '@mui/icons-material/FormatAlignRight';
import FormatAlignJustifyIcon from '@mui/icons-material/FormatAlignJustify';

// Types
import { Editor } from '@tiptap/react';
import type { TextStyleOptions } from '@tiptap/extension-text-style';
interface ExtendedTextStyleOptions extends TextStyleOptions {
  types: string[];
}
type MenuBarProps = {
  editor: Editor | null;
  fontColor: string;
  setFontColor: React.Dispatch<React.SetStateAction<string>>;
};
type TiptapProps = {
  editable?: boolean;
  placeholder?: string;
  content?: JSONContent | null;
  update?: (content: JSONContent | null) => void;
};

const MenuBar = ({ editor, fontColor, setFontColor }: MenuBarProps) => {
  const theme = useTheme();

  // Text size
  const [textSizeMenuAnchorEl, setTextSizeMenuAnchorEl] =
    React.useState<null | HTMLElement>(null);
  const openTextSizeMenu = Boolean(textSizeMenuAnchorEl);
  const handleTextSizeMenuClick = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    setTextSizeMenuAnchorEl(event.currentTarget);
  };
  const handleCloseTextSizeMenu = () => {
    setTextSizeMenuAnchorEl(null);
  };

  // Font color
  const [fontColorMenuAnchorEl, setFontColorMenuAnchorEl] =
    React.useState<null | HTMLElement>(null);
  const openFontColorMenu = Boolean(fontColorMenuAnchorEl);
  const handleFontColorMenuClick = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    setFontColorMenuAnchorEl(event.currentTarget);
  };
  const handleCloseColorMenu = () => {
    setFontColor(() => '');
    setFontColorMenuAnchorEl(null);
  };

  // Image
  const [image, setImage] = React.useState<string>('');
  const [imageMenuAnchorEl, setImageMenuAnchorEl] =
    React.useState<null | HTMLElement>(null);
  const openImageMenu = Boolean(imageMenuAnchorEl);
  const handleImageMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setImageMenuAnchorEl(event.currentTarget);
  };
  const handleCloseImageMenu = () => {
    setImage(() => '');
    setImageMenuAnchorEl(null);
  };

  // YouTube
  const [video, setVideo] = React.useState<string>('');
  const [videoMenuAnchorEl, setVideoMenuAnchorEl] =
    React.useState<null | HTMLElement>(null);
  const openVideoMenu = Boolean(videoMenuAnchorEl);
  const handleVideoMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setVideoMenuAnchorEl(event.currentTarget);
  };
  const handleCloseVideoMenu = () => {
    setVideo(() => '');
    setVideoMenuAnchorEl(null);
  };

  if (!editor) {
    return null;
  }

  return (
    <Stack direction="row" sx={{ overflow: 'auto' }}>
      {/* Undo */}
      <IconButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().chain().focus().undo().run()}
      >
        <UndoIcon />
      </IconButton>
      {/* Redo */}
      <IconButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().chain().focus().redo().run()}
      >
        <RedoIcon />
      </IconButton>
      {/* Text size */}
      <IconButton
        id="text-size-button"
        aria-controls={openTextSizeMenu ? 'text-size-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={openTextSizeMenu ? 'true' : undefined}
        onClick={handleTextSizeMenuClick}
      >
        <FormatSizeIcon />
      </IconButton>
      <Menu
        id="text-size-menu"
        anchorEl={textSizeMenuAnchorEl}
        open={openTextSizeMenu}
        onClose={handleCloseTextSizeMenu}
        MenuListProps={{
          'aria-labelledby': 'text-size-button',
        }}
      >
        <MenuItem
          onClick={() => {
            editor.chain().focus().setParagraph().run();
            handleCloseTextSizeMenu();
          }}
          className={editor.isActive('paragraph') ? 'is-active' : ''}
        >
          Paragraph
        </MenuItem>
        <MenuItem
          onClick={() => {
            editor.chain().focus().toggleHeading({ level: 1 }).run();
            handleCloseTextSizeMenu();
          }}
          className={
            editor.isActive('heading', { level: 1 }) ? 'is-active' : ''
          }
        >
          Heading 1
        </MenuItem>
        <MenuItem
          onClick={() => {
            editor.chain().focus().toggleHeading({ level: 2 }).run();
            handleCloseTextSizeMenu();
          }}
          className={
            editor.isActive('heading', { level: 2 }) ? 'is-active' : ''
          }
        >
          Heading 2
        </MenuItem>
        <MenuItem
          onClick={() => {
            editor.chain().focus().toggleHeading({ level: 3 }).run();
            handleCloseTextSizeMenu();
          }}
          className={
            editor.isActive('heading', { level: 3 }) ? 'is-active' : ''
          }
        >
          Heading 3
        </MenuItem>
        <MenuItem
          onClick={() => {
            editor.chain().focus().toggleHeading({ level: 4 }).run();
            handleCloseTextSizeMenu();
          }}
          className={
            editor.isActive('heading', { level: 4 }) ? 'is-active' : ''
          }
        >
          Heading 4
        </MenuItem>
        <MenuItem
          onClick={() => {
            editor.chain().focus().toggleHeading({ level: 5 }).run();
            handleCloseTextSizeMenu();
          }}
          className={
            editor.isActive('heading', { level: 5 }) ? 'is-active' : ''
          }
        >
          Heading 5
        </MenuItem>
        <MenuItem
          onClick={() => {
            editor.chain().focus().toggleHeading({ level: 6 }).run();
            handleCloseTextSizeMenu();
          }}
          className={
            editor.isActive('heading', { level: 6 }) ? 'is-active' : ''
          }
        >
          Heading 6
        </MenuItem>
      </Menu>
      {/* Bold */}
      <IconButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={editor.isActive('bold') ? 'is-active' : ''}
      >
        <FormatBoldIcon />
      </IconButton>
      {/* Italic */}
      <IconButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={editor.isActive('italic') ? 'is-active' : ''}
      >
        <FormatItalicIcon />
      </IconButton>
      {/* Strikethrough */}
      <IconButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={!editor.can().chain().focus().toggleStrike().run()}
        className={editor.isActive('strike') ? 'is-active' : ''}
      >
        <StrikethroughSIcon />
      </IconButton>
      {/* Text color */}
      <IconButton
        id="font-color-menu-button"
        aria-controls={openFontColorMenu ? 'font-color-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={openFontColorMenu ? 'true' : undefined}
        onClick={handleFontColorMenuClick}
        sx={{ color: fontColor }}
        className={
          editor.isActive('textStyle', { color: fontColor }) ? 'is-active' : ''
        }
      >
        <FormatColorTextIcon />
      </IconButton>
      <Menu
        PopoverClasses={{ paper: 'font-color-menu' }}
        id="font-color-menu"
        anchorEl={fontColorMenuAnchorEl}
        open={openFontColorMenu}
        onClose={handleCloseColorMenu}
        MenuListProps={{
          'aria-labelledby': 'font-color-menu-button',
        }}
        sx={{
          '.MuiMenu-paper': {
            bgcolor: 'transparent',
            boxShadow: 'none',
            backgroundImage: 'none',
            padding: '16px 16px 4px 16px',
          },
          '.MuiMenu-list': {
            p: 0,
          },
        }}
      >
        <HexColorPicker
          color={fontColor}
          onChange={(newColor) => {
            setFontColor(() => newColor);
            editor.chain().focus().setColor(newColor).run();
          }}
        />
      </Menu>
      {/* Bullet list */}
      <IconButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={editor.isActive('bulletList') ? 'is-active' : ''}
      >
        <FormatListBulletedIcon />
      </IconButton>
      {/* Ordered list */}
      <IconButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={editor.isActive('orderedList') ? 'is-active' : ''}
      >
        <FormatListNumberedIcon />
      </IconButton>
      {/* Blockquote */}
      <IconButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={editor.isActive('blockquote') ? 'is-active' : ''}
      >
        <FormatQuoteIcon />
      </IconButton>
      {/* Image */}
      <IconButton
        id="image-menu-button"
        aria-controls={openImageMenu ? 'image-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={openImageMenu ? 'true' : undefined}
        onClick={handleImageMenuClick}
      >
        <ImageIcon />
      </IconButton>
      <Menu
        PopoverClasses={{ paper: 'image-menu' }}
        id="image-menu"
        anchorEl={imageMenuAnchorEl}
        open={openImageMenu}
        onClose={handleCloseImageMenu}
        MenuListProps={{
          'aria-labelledby': 'image-menu-button',
        }}
        sx={{
          '.MuiMenu-paper': {
            bgcolor: 'transparent',
            boxShadow: 'none',
            backgroundImage: 'none',
            padding: '16px 16px 4px 16px',
          },
          '.MuiMenu-list': {
            p: 0,
          },
        }}
      >
        <Box
          component="form"
          onSubmit={(e) => {
            e.preventDefault();
            editor.chain().focus().setImage({ src: image }).run();
            handleCloseImageMenu();
          }}
        >
          <TextField
            type="url"
            fullWidth={true}
            label="Image"
            variant="filled"
            value={image}
            onChange={(e) => {
              setImage(() => e.target.value);
            }}
            sx={{ backgroundColor: 'white' }}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            startIcon={<AddIcon />}
          >
            Add
          </Button>
        </Box>
      </Menu>
      {/* Video */}
      <IconButton
        id="video-menu-button"
        aria-controls={openVideoMenu ? 'video-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={openVideoMenu ? 'true' : undefined}
        onClick={handleVideoMenuClick}
      >
        <YouTubeIcon />
      </IconButton>
      <Menu
        id="video-menu"
        anchorEl={videoMenuAnchorEl}
        open={openVideoMenu}
        onClose={handleCloseVideoMenu}
        MenuListProps={{
          'aria-labelledby': 'video-menu-button',
        }}
        sx={{
          '.MuiMenu-paper': {
            bgcolor: 'transparent',
            boxShadow: 'none',
            backgroundImage: 'none',
            padding: '16px 16px 4px 16px',
          },
          '.MuiMenu-list': {
            p: 0,
          },
        }}
      >
        <Box
          component="form"
          onSubmit={(e) => {
            e.preventDefault();
            editor.commands.setYoutubeVideo({
              src: video,
              width: 640,
              height: 480,
            });
            handleCloseVideoMenu();
          }}
        >
          <TextField
            type="url"
            fullWidth={true}
            label="YouTube"
            variant="filled"
            placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
            value={video}
            onChange={(e) => {
              setVideo(() => e.target.value);
            }}
            sx={{ backgroundColor: 'white' }}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            startIcon={<YouTubeIcon />}
          >
            Embed
          </Button>
        </Box>
      </Menu>
      {/* Align left */}
      <IconButton
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        className={editor.isActive({ textAlign: 'left' }) ? 'is-active' : ''}
      >
        <FormatAlignLeftIcon />
      </IconButton>
      {/* Align center */}
      <IconButton
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        className={editor.isActive({ textAlign: 'center' }) ? 'is-active' : ''}
      >
        <FormatAlignCenterIcon />
      </IconButton>
      {/* Align right */}
      <IconButton
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        className={editor.isActive({ textAlign: 'right' }) ? 'is-active' : ''}
      >
        <FormatAlignRightIcon />
      </IconButton>
      {/* Align justify */}
      <IconButton
        onClick={() => editor.chain().focus().setTextAlign('justify').run()}
        className={editor.isActive({ textAlign: 'justify' }) ? 'is-active' : ''}
      >
        <FormatAlignJustifyIcon />
      </IconButton>
      {/* Code */}
      <IconButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        disabled={!editor.can().chain().focus().toggleCode().run()}
        className={editor.isActive('code') ? 'is-active' : ''}
      >
        <CodeIcon />
      </IconButton>
      {/* Code block */}
      <IconButton
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={editor.isActive('codeBlock') ? 'is-active' : ''}
      >
        <IntegrationInstructionsIcon />
      </IconButton>
      <IconButton onClick={() => editor.chain().focus().unsetAllMarks().run()}>
        <FormatClearIcon />
      </IconButton>
      {/* Clear layers */}
      <IconButton onClick={() => editor.chain().focus().clearNodes().run()}>
        <LayersClearIcon />
      </IconButton>
      {/* Horizontal rule */}
      <IconButton
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      >
        <HorizontalRuleIcon />
      </IconButton>
      <IconButton onClick={() => editor.chain().focus().setHardBreak().run()}>
        <PlaylistAddIcon />
      </IconButton>
    </Stack>
  );
};

const Tiptap = ({
  editable = true,
  placeholder = 'Write something here...',
  content,
  update,
}: TiptapProps) => {
  const [fontColor, setFontColor] = React.useState<string>('');

  const editor = useEditor({
    editable: editable,
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false, // TODO : Making this as `false` becase marks are not preserved when I try to preserve attrs, awaiting a bit of help
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false, // TODO : Making this as `false` becase marks are not preserved when I try to preserve attrs, awaiting a bit of help
        },
      }),
      Color.configure({ types: [TextStyle.name, ListItem.name] }),
      TextStyle.configure({
        types: [ListItem.name],
      } as ExtendedTextStyleOptions),
      Image,
      Youtube.configure({
        modestBranding: true,
      }),
      Placeholder.configure({
        placeholder: placeholder,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],

    content: content,

    //     content: `
    //       <h2>
    //         Hi there,
    //       </h2>
    //       <p>
    //         this is a <em>basic</em> example of <strong>tiptap</strong>. Sure, there are all kind of basic text styles you’d probably expect from a text editor. <span style="color: #958DF1">But wait until you see the lists</span>:
    //       </p>
    //       <ul>
    //         <li>
    //           That’s a bullet list with one …
    //         </li>
    //         <li>
    //           … or two list items.
    //         </li>
    //       </ul>
    //       <p>
    //         Isn’t that great? And all of that is editable. But wait, there’s more. Let’s try a code block:
    //       </p>
    //       <pre><code class="language-css">body {
    //   display: none;
    // }</code></pre>
    //       <p>
    //         I know, I know, this is impressive. It’s only the tip of the iceberg though. Give it a try and click a little bit around. Don’t forget to check the other examples too.
    //       </p>
    //       <blockquote>
    //         Wow, that’s amazing. Good work, boy! 👏
    //         <br />
    //         — Mom
    //       </blockquote>
    //     `,
    onBlur({ editor, event }) {
      // The editor isn’t focused anymore.
      if (
        !event?.relatedTarget ||
        (event?.relatedTarget instanceof HTMLElement &&
          !event?.relatedTarget?.classList?.contains('font-color-menu'))
      ) {
        setFontColor(() => '');
      }
    },
    onSelectionUpdate({ editor }) {
      // The selection has changed.
      let selectedColor = editor.getAttributes('textStyle').color;
      if (typeof selectedColor === 'string') {
        setFontColor(() => selectedColor);
      } else if (selectedColor === undefined) {
        setFontColor(() => '');
      }
    },
    onUpdate: ({ editor }) => {
      if (editor.getHTML() === '<p></p>') {
        return update && update(null);
      }
      const json = editor.getJSON();
      update && update(json);
    },
  });

  return (
    <div className={styles.editor}>
      {editable && (
        <MenuBar
          editor={editor}
          fontColor={fontColor}
          setFontColor={setFontColor}
        />
      )}
      <EditorContent editor={editor} />
    </div>
  );
};

export default Tiptap;
